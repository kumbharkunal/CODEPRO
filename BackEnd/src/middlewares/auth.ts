import { RedirectUrl } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { decode } from "punycode";

interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        req.user = decoded;
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token has expired' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    };
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not Authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied, insufficient permissions' });
        }

        next();
    };
};