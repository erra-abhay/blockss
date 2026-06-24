import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const username = crypto.randomBytes(6).toString('hex'); // 12 chars
  const password = crypto.randomBytes(12).toString('base64');
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.platformAdmin.create({
    data: { username, passwordHash }
  });

  console.log('--- PLATFORM ADMIN CREATED ---');
  console.log('Username:', username);
  console.log('Password:', password);
  console.log('------------------------------');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
