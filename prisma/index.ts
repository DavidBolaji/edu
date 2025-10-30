import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { PrismaClient } from '@prisma/client';

const globalPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalPrisma.prisma || new PrismaClient();

export const luciaAdapter = new PrismaAdapter(db.session, db.user);

if (process.env.NODE_ENV !== 'production') globalPrisma.prisma = db;

export default db;
