import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { password, name } = await request.json()
    const hashedPassword = bcrypt.hashSync(password, 10)
    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }
    const existingUser = await prisma.user.findUnique({
      where: { name },
    });
    if (existingUser) {
      return Response.json({ error: 'user already exists' }, { status: 409 });
    }
    if (!password) {
      return Response.json({ error: 'password is required' }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
      },
    })
    return Response.json({ message: 'User created', user })
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: `User could not be created : ${error}` })
    }
    return Response.json({ error: `User could not be created ${error}` })
  }
}