const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      phaseId: 'fdde2ff3-142a-40c0-85dd-b02ca311046f'
    },
    orderBy: {
      matchDate: 'asc'
    }
  });
  console.log(`Found ${matches.length} matches in Dieciseisavos de final:`);
  matches.forEach((m, idx) => {
    console.log(`[${idx}] ID: ${m.id} Date: ${m.matchDate} Home: ${m.homeTeamId} Away: ${m.awayTeamId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
