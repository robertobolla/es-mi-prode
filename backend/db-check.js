const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comp = await prisma.competition.findFirst({
    include: {
      phases: {
        include: {
          groups: true,
          matches: {
            take: 5
          }
        }
      }
    }
  });
  console.log('COMPETITION:', comp.name, '(', comp.id, ')');
  console.log('PHASES:');
  comp.phases.forEach(p => {
    console.log(`- Phase: "${p.name}" (ID: ${p.id})`);
    console.log(`  Groups count: ${p.groups.length}`);
    console.log(`  Matches count (showing first ${p.matches.length}):`);
    p.matches.forEach(m => {
      console.log(`    * Match: ${m.homeTeamId} vs ${m.awayTeamId}, groupId: ${m.groupId}, date: ${m.matchDate}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
