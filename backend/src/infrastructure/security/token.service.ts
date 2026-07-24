import * as jwt from 'jsonwebtoken';
import { Logger } from '../logging/logger';

export interface TokenPayload {
    userId: string;
    username: string;
    role: string;
    permissions: string[];
}

export class TokenService {
    private static accessSecret = process.env.JWT_ACCESS_SECRET || 'access_default_secret_key_987654321';
    private static refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_default_secret_key_123456789';

    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.accessSecret, { expiresIn: '15m' });
    }

    static generateRefreshToken(payload: { userId: string }): string {
        return jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    }

    static verifyAccessToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.accessSecret) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    static verifyRefreshToken(token: string): { userId: string } | null {
        try {
            return jwt.verify(token, this.refreshSecret) as { userId: string };
        } catch (error) {
            return null;
        }
    }
}
