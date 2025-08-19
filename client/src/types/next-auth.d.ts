import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            name: string;
            role: string;
            id: string;
            token: string;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        name: string;
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        name: string;
        role: string;
        id: string;
    }
}