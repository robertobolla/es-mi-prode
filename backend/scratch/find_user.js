const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'robertobolla9@gmail.com' },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', user.id, user.username);

  const competitions = await prisma.competition.findMany({
    where: { active: true },
  });

  console.log('Active competitions:', competitions.map(c => ({ id: c.id, name: c.name })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
