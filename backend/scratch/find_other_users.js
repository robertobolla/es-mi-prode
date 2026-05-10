const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    where: {
      email: { not: 'robertobolla9@gmail.com' }
    }
  });

  console.log('Other users found:', users.map(u => ({ id: u.id, username: u.username })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
