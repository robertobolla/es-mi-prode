const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const mainUserEmail = 'robertobolla9@gmail.com';
  const mainUser = await prisma.user.findUnique({
    where: { email: mainUserEmail },
  });

  if (!mainUser) {
    console.error(`User with email ${mainUserEmail} not found.`);
    return;
  }

  const mainUserId = mainUser.id;
  
  // Find an active competition
  const competition = await prisma.competition.findFirst({
    where: { active: true },
    include: {
      phases: {
        include: {
          matches: true
        }
      }
    }
  });

  if (!competition) {
    console.error('No active competition found.');
    return;
  }

  const competitionId = competition.id;
  const allMatches = competition.phases.flatMap(p => p.matches);

  console.log(`Using Main User: ${mainUser.username} (${mainUserId})`);
  console.log(`Using Competition: ${competition.name} (${competitionId})`);
  console.log(`Found ${allMatches.length} matches to predict.`);

  const testUsersData = [
    { username: 'JuanPerez', email: 'juan@example.com', fullName: 'Juan Perez' },
    { username: 'MariaGarcia', email: 'maria@example.com', fullName: 'Maria Garcia' },
    { username: 'CarlosLopez', email: 'carlos@example.com', fullName: 'Carlos Lopez' },
    { username: 'AnaMartinez', email: 'ana@example.com', fullName: 'Ana Martinez' },
    { username: 'DiegoRodriguez', email: 'diego@example.com', fullName: 'Diego Rodriguez' },
    { username: 'SantiPro', email: 'santi@example.com', fullName: 'Santiago Pro' },
    { username: 'Luifa', email: 'luifa@example.com', fullName: 'Luis Fabiano' },
    { username: 'LeoMessi10', email: 'leo@example.com', fullName: 'Lionel Messi' },
  ];

  const testUserIds = [];

  console.log('Creating/Updating test users...');
  for (const userData of testUsersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        supabaseId: crypto.randomUUID(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random`,
      },
    });
    testUserIds.push(user.id);
  }

  const allUserIds = [mainUserId, ...testUserIds];

  const tournamentNames = [
    'Torneo de Amigos 🏆',
    'La Scaloneta Fan Club',
    'Prode de la Oficina 💼',
    'Familia y Futbol ⚽',
  ];

  console.log('Creating tournaments...');
  for (const name of tournamentNames) {
    // Generate a unique share code
    let shareCode;
    let exists = true;
    while (exists) {
      shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const existing = await prisma.tournament.findUnique({ where: { shareCode } });
      if (!existing) exists = false;
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        creatorId: mainUserId,
        competitionId,
        shareCode,
        isPublic: true,
        pointsSystem: {
          exactMatch: 5,
          correctResult: 3,
        },
        status: 'OPEN',
      },
    });

    console.log(`Created tournament: ${name} (${shareCode})`);

    console.log(`Adding members to ${name}...`);
    for (const userId of allUserIds) {
      // Randomize points for ranking
      const totalPoints = Math.floor(Math.random() * 80) + 10; // Between 10 and 90
      const exactResults = Math.floor(totalPoints / 5);
      const correctResults = Math.floor((totalPoints % 5) / 3);

      await prisma.tournamentMember.upsert({
        where: {
          tournamentId_userId: {
            tournamentId: tournament.id,
            userId,
          },
        },
        update: {
          totalPoints,
          exactResults,
          correctResults,
        },
        create: {
          tournamentId: tournament.id,
          userId,
          totalPoints,
          exactResults,
          correctResults,
        },
      });

      // Add some predictions for this user if they don't have them
      // We only do this for the first 10 matches to avoid bloat
      for (const match of allMatches.slice(0, 10)) {
        await prisma.matchPrediction.upsert({
          where: {
            userId_matchId: {
              userId,
              matchId: match.id,
            },
          },
          update: {},
          create: {
            userId,
            matchId: match.id,
            homeScore: Math.floor(Math.random() * 4),
            awayScore: Math.floor(Math.random() * 4),
          },
        });
      }
    }

    // Update ranks based on points
    const members = await prisma.tournamentMember.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { totalPoints: 'desc' },
    });

    for (let i = 0; i < members.length; i++) {
      await prisma.tournamentMember.update({
        where: { id: members[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  console.log('Done! All test tournaments created and populated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
