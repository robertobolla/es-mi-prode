const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    take: 15
  });
  console.log('TEAMS IN DATABASE:');
  teams.forEach(t => {
    console.log(`- ${t.name} (flagUrl: ${t.flagUrl})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
