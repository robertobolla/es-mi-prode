const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const group = await prisma.group.findFirst({
    where: { name: 'Grupo A' },
    include: {
      matches: {
        include: {
          homeTeam: { include: { team: true } },
          awayTeam: { include: { team: true } }
        }
      }
    }
  });

  if (!group) {
    console.log('No Group A found!');
    return;
  }

  console.log(`GROUP: ${group.name} (ID: ${group.id})`);
  console.log('MATCHES:');
  const sorted = group.matches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  sorted.forEach((m, idx) => {
    console.log(`[Index ${idx}] ${m.homeTeam?.team?.name} vs ${m.awayTeam?.team?.name} | Date: ${m.matchDate} | Status: ${m.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
