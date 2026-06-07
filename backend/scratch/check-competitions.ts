import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const competitions = await prisma.competition.findMany();
  console.log('Competitions:', JSON.stringify(competitions, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
