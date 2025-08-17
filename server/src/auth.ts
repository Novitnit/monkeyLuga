import jwt from 'jsonwebtoken';

export default function verifyToken(token: string,secret:string):boolean {
    try {
        const decoded = jwt.verify(token,secret);
        return true;
    } catch (error) {
        return false;
    }
}