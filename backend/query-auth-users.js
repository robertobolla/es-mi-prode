const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT id, email, created_at, last_sign_in_at 
    FROM auth.users 
    WHERE email = 'robertobolla9@gmail.com'
  `;
  console.log('AUTH_USERS:', JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
