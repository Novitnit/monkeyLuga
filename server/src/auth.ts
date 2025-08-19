import jwt from 'jsonwebtoken';
import { TokenData } from './types/tokendata'

export function verifyToken(token: string,secret:string):boolean {
    try {
        const decoded = jwt.verify(token,secret);
        return true;
    } catch (error) {
        return false;
    }
}

export function readToken(token: string,secret:string): TokenData | null {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded as TokenData;
    } catch (error) {
        return null;
    }
}