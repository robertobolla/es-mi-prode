import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activeCompetition = await prisma.competition.findFirst({
    where: { active: true },
  });

  if (!activeCompetition) {
    console.log('No active competition found!');
    return;
  }
  console.log('Active Competition:', activeCompetition.id, activeCompetition.name);

  // Count matches in active competition
  const matchesCount = await prisma.match.count({
    where: { phase: { competitionId: activeCompetition.id } },
  });
  console.log(`Total matches in active competition: ${matchesCount}`);

  // Count finished matches in active competition
  const finishedMatchesCount = await prisma.match.count({
    where: { phase: { competitionId: activeCompetition.id }, status: 'FINISHED' },
  });
  console.log(`Finished matches in active comp: ${finishedMatchesCount}`);

  // Count predictions for matches in active competition
  const predictionsCount = await prisma.matchPrediction.count({
    where: { match: { phase: { competitionId: activeCompetition.id } } },
  });
  console.log(`Total predictions for active comp matches: ${predictionsCount}`);

  // Check if we have any tournaments
  const tournaments = await prisma.tournament.findMany({
    where: { competitionId: activeCompetition.id },
    select: { id: true, name: true, _count: { select: { members: true } } },
  });
  console.log('Tournaments using this competition:', JSON.stringify(tournaments, null, 2));

  // Let's run a manual global ranking calculation on the active competition and print the result
  const compId = activeCompetition.id;
  const competition = await prisma.competition.findUnique({
    where: { id: compId },
    include: {
      phases: {
        include: {
          matches: {
            where: { status: 'FINISHED' },
            include: { predictions: true },
          },
        },
      },
    },
  });

  const userScores = new Map<string, number>();
  if (competition) {
    for (const phase of competition.phases) {
      for (const match of phase.matches) {
        console.log(`Match ${match.id} is finished. Predictions count: ${match.predictions.length}`);
        for (const pred of match.predictions) {
          userScores.set(pred.userId, (userScores.get(pred.userId) || 0) + 1); // just count matching predictions
        }
      }
    }
  }
  console.log(`Total users with scored predictions: ${userScores.size}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
