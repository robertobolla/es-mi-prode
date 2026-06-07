import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const predictions = await prisma.matchPrediction.findMany({
    take: 10,
  });
  console.log('Match Predictions (sample):', JSON.stringify(predictions, null, 2));

  const globalRankings = await prisma.globalRanking.findMany({
    take: 10,
  });
  console.log('Global Rankings (sample):', JSON.stringify(globalRankings, null, 2));

  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    select: {
      id: true,
      homeTeam: { select: { team: { select: { name: true } } } },
      awayTeam: { select: { team: { select: { name: true } } } },
      status: true,
      homeScore90: true,
      awayScore90: true,
    }
  });
  console.log('Finished Matches:', JSON.stringify(matches, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
