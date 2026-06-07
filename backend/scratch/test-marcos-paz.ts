import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
    }
  });

  console.log('--- ALL USERS ---');
  users.forEach(u => {
    console.log(`Username: ${u.username}, ID: ${u.id}, Email: ${u.email}`);
  });

  // Pick a user who is NOT colo9
  const otherUser = users.find(u => u.username !== 'colo9');
  if (!otherUser) {
    console.error('No other user found in DB!');
    return;
  }

  const userId = otherUser.id;
  const searchTerm = 'marcos paz';

  console.log(`\n--- TESTING SEARCH FOR "${searchTerm}" AS USER "${otherUser.username}" (${userId}) ---`);

  const where: any = {
    status: 'OPEN',
    members: {
      none: {
        userId,
      },
    },
  };

  const cleanSearch = searchTerm.trim();
  where.OR = [
    {
      name: {
        contains: cleanSearch,
        mode: 'insensitive',
      },
    },
    {
      shareCode: cleanSearch.toUpperCase(),
    },
  ];

  console.log('Query where clause:', JSON.stringify(where, null, 2));

  const results = await prisma.tournament.findMany({
    where,
    include: {
      members: {
        select: { userId: true }
      }
    }
  });

  console.log(`Results found: ${results.length}`);
  results.forEach(t => {
    console.log(`- "${t.name}" (Code: ${t.shareCode}, Public: ${t.isPublic}, Members: ${t.members.map(m => m.userId).join(', ')})`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
