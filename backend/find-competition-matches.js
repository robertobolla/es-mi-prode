const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comp = await prisma.competition.findFirst({
    where: {
      name: {
        contains: 'Mundial'
      }
    },
    include: {
      phases: {
        include: {
          matches: {
            where: {
              status: 'FINISHED'
            }
          }
        }
      }
    }
  });

  if (!comp) {
    console.log('COMPETITION_NOT_FOUND');
    return;
  }

  console.log('COMPETITION:', comp.name, 'ID:', comp.id);
  let finishedMatchesCount = 0;
  comp.phases.forEach(p => {
    p.matches.forEach(m => {
      finishedMatchesCount++;
      console.log(`- Match ID: ${m.id}, Phase: ${p.name}, Status: ${m.status}, Score: ${m.homeScore90}-${m.awayScore90}`);
    });
  });
  console.log(`TOTAL_FINISHED_MATCHES: ${finishedMatchesCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
