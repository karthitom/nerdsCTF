import { Request, Response } from 'express';
import { UserRepositoryImpl } from '../../infrastructure/repositories/user.repository.impl';
import { HashService } from '../../infrastructure/security/hash.service';
import { TokenService } from '../../infrastructure/security/token.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { Logger } from '../../infrastructure/logging/logger';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const userRepo = new UserRepositoryImpl();

// ── Firestore helpers ───────────────────────────────────────────────────────

function db() {
    return FirebaseService.db();
}

async function writeAuditLog(userId: string | null, action: string, details: string, ipAddress?: string) {
    await db().collection('auditLogs').add({
        userId,
        action,
        details,
        ipAddress: ipAddress ?? null,
        createdAt: new Date(),
    });
}

async function storeRefreshToken(userId: string, token: string, expiresAt: Date) {
    await db().collection('refreshTokens').doc(token).set({
        userId,
        token,
        expiresAt,
        isRevoked: false,
        createdAt: new Date(),
    });
}

// ── Controller ──────────────────────────────────────────────────────────────

export class AuthController {
    static async register(req: Request, res: Response) {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ success: false, error: 'Email, username, and password are required.' });
        }

        try {
            const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.',
                });
            }

            const existingEmail = await userRepo.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({ success: false, error: 'Email already registered.' });
            }

            const existingUser = await userRepo.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({ success: false, error: 'Username already taken.' });
            }

            // Resolve default USER role from Firestore
            const roleSnap = await db().collection('roles').where('name', '==', 'USER').limit(1).get();
            if (roleSnap.empty) {
                throw new Error('Default role "USER" not configured in Firestore.');
            }
            const userRoleId = roleSnap.docs[0].id;

            const passwordHash = await HashService.hash(password);

            const newUser = await userRepo.create({ email, username, passwordHash, roleId: userRoleId });

            await writeAuditLog(newUser.id, 'REGISTER', `User registered: ${username}`, req.ip);

            Logger.info(`User registered: ${username}`, 'AuthController');
            return res.status(201).json({
                success: true,
                message: 'Registration successful! You can now log in.',
            });
        } catch (error: any) {
            Logger.error('Registration failed', error.stack, 'AuthController');
            return res.status(500).json({ success: false, error: 'Internal registration error.' });
        }
    }

    static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        try {
            const user = await userRepo.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }

            const isMatch = await HashService.verify(user.passwordHash, password);
            if (!isMatch) {
                await writeAuditLog(user.id, 'LOGIN_FAILURE', `Failed login for email: ${email}`, req.ip);
                return res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }

            const tokenPayload = {
                userId: user.id,
                username: user.username,
                role: user.role.name,
                permissions: user.role.permissions,
            };

            const accessToken = TokenService.generateAccessToken(tokenPayload);
            const refreshToken = TokenService.generateRefreshToken({ userId: user.id });

            await storeRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            await writeAuditLog(user.id, 'LOGIN_SUCCESS', 'User logged in.', req.ip);

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role.name,
                    avatar: user.avatar,
                    country: user.country,
                },
            });
        } catch (error: any) {
            Logger.error('Login process encountered error', error.stack, 'AuthController');
            return res.status(500).json({ success: false, error: 'Server authentication pipeline error.' });
        }
    }

    static async refreshToken(req: Request, res: Response) {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, error: 'Refresh token cookie missing.' });
        }

        try {
            const payload = TokenService.verifyRefreshToken(token);
            if (!payload) {
                return res.status(401).json({ success: false, error: 'Invalid refresh token.' });
            }

            const tokenDoc = await db().collection('refreshTokens').doc(token).get();
            if (!tokenDoc.exists) {
                return res.status(401).json({ success: false, error: 'Refresh token not found.' });
            }

            const tokenData = tokenDoc.data()!;
            if (tokenData.isRevoked || tokenData.expiresAt.toDate() < new Date()) {
                // Potential reuse — revoke ALL tokens for this user
                const userTokensQ = await db()
                    .collection('refreshTokens')
                    .where('userId', '==', payload.userId)
                    .get();
                const batch = db().batch();
                userTokensQ.docs.forEach((d) => batch.update(d.ref, { isRevoked: true }));
                await batch.commit();
                return res.status(401).json({ success: false, error: 'Revoked refresh token detected. Security lockout initiated.' });
            }

            const user = await userRepo.findById(payload.userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'Associated user context not found.' });
            }

            const newTokenPayload = {
                userId: user.id,
                username: user.username,
                role: user.role.name,
                permissions: user.role.permissions,
            };

            const newAccessToken = TokenService.generateAccessToken(newTokenPayload);
            const newRefreshToken = TokenService.generateRefreshToken({ userId: user.id });

            // Rotate: revoke old, store new
            await db().collection('refreshTokens').doc(token).update({ isRevoked: true });
            await storeRefreshToken(user.id, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({ success: true, message: 'Tokens rotated successfully.' });
        } catch (error: any) {
            Logger.error('Token rotation failure', error.stack, 'AuthController');
            return res.status(500).json({ success: false, error: 'Token refresh error.' });
        }
    }

    static async logout(req: AuthenticatedRequest, res: Response) {
        const token = req.cookies.refreshToken;
        if (token) {
            try {
                await db().collection('refreshTokens').doc(token).update({ isRevoked: true });
            } catch (_) {}
        }

        if (req.user) {
            await writeAuditLog(req.user.userId, 'LOGOUT', 'User logged out.', req.ip);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.json({ success: true, message: 'Logged out successfully.' });
    }

    static async getMe(req: AuthenticatedRequest, res: Response) {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthenticated.' });
        }

        try {
            const user = await userRepo.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User details not found.' });
            }

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role.name,
                    avatar: user.avatar,
                    country: user.country,
                    createdAt: user.createdAt,
                },
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: 'Error fetching user profile.' });
        }
    }
}
