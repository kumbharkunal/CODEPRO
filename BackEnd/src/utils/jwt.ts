import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (payload: TokenPayload): string => {
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET as string,
        {
            expiresIn: '7d',
        }
    );
    return token;
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET as string,
        {
            expiresIn: '30d',
        }
    );
    return token;
}
