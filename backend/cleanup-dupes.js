const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find duplicate lowercase "argentina" team
  const dupes = await p.team.findMany({
    where: { name: { in: ['argentina'] } },
  });
  console.log('Found duplicates:', dupes.map(d => d.name));
  
  for (const d of dupes) {
    await p.competitionTeam.deleteMany({ where: { teamId: d.id } });
    await p.team.delete({ where: { id: d.id } });
    console.log('Deleted:', d.name, d.id);
  }
  
  console.log('Done!');
}

main().catch(console.error).finally(() => p.$disconnect());
