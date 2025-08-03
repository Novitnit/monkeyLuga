import NextAuth from "next-auth"
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                name: { label: "Name", type: "text", placeholder: "Enter your username" },
                password: { label: "Password", type: "password", placeholder: "Enter your password" }
            },
            async authorize(credentials, req) {
                const { name, password } = credentials || {}

                if (!name || !password) {
                    throw new Error("All fields are required")
                }

                const user = await prisma.user.findUnique({
                    where: { name }
                })

                if (!user) {
                    throw new Error("User not found")
                }

                const isValidPassword = await bcrypt.compare(password, user.password)
                if (!isValidPassword) {
                    throw new Error("Invalid password")
                }

                const { password: _, ...userWithoutPassword } = user    
                return userWithoutPassword
            }
        })
    ],
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt"
    },
    callbacks:{
        jwt({ token, user }) {
            if(user){
                token.id = user.id
                token.name = user.name
                token.role = user.role
            }
            return token
        },

        session({ session, token}){
            if(token){
                session.user.id = token.id
                session.user.name = token.name
                session.user.role = token.role
            }
            return session
        }
    },
})

export { handler as GET, handler as POST }