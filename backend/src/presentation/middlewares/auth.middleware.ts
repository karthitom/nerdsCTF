import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../infrastructure/security/token.service';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        role: string;
        permissions: string[];
    };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Try to get token from cookies first, then Authorization header
    let token = req.cookies.accessToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const payload = TokenService.verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired access token' });
    }

    req.user = payload;
    next();
};

export const requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized: User context missing' });
        }

        const hasPerm = req.user.permissions.includes(permission);
        if (!hasPerm) {
            return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
        }

        next();
    };
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: User context missing' });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    next();
};
