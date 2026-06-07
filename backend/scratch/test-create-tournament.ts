import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'b63d3f99-8a55-4a0a-b739-b9820e5e75de'; // Roberto
  const shareCode = 'TESTCODE';

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Test Tournament',
        format: 'copa',
        roundTrip: false,
        predictGroups: true,
        includeExtraTime: false,
        creatorId: userId,
        shareCode,
        pointsSystem: {
          exactMatch: 5,
          correctResult: 3,
          matchdayWinner: undefined, // This might be the issue
        },
      },
    });
    console.log('Created:', tournament.id);
  } catch (error) {
    console.error('Error creating tournament:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
