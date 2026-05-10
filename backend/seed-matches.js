// Generate all round-robin group stage matches
// 4 teams per group = 6 matches per group (3 match days × 2 matches)
// Match day 1: Mar 27 12:00 PM
// Match day 2: Mar 28 12:00 PM
// Match day 3: Mar 28  6:00 PM
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Schedule (Argentina time UTC-3)
const MATCH_DAYS = [
  new Date('2026-03-27T15:00:00Z'), // Mar 27 12:00 PM ART
  new Date('2026-03-28T15:00:00Z'), // Mar 28 12:00 PM ART
  new Date('2026-03-28T21:00:00Z'), // Mar 28  6:00 PM ART
];

// Round-robin for 4 teams: 3 match days, 2 matches each
// Day 1: T1 vs T2, T3 vs T4
// Day 2: T1 vs T3, T2 vs T4
// Day 3: T1 vs T4, T2 vs T3
const ROUND_ROBIN = [
  [[0, 1], [2, 3]], // Day 1
  [[0, 2], [1, 3]], // Day 2
  [[0, 3], [1, 2]], // Day 3
];

async function main() {
  const competition = await prisma.competition.findFirst();
  if (!competition) { console.error('No competition found'); process.exit(1); }

  // Find the "Fase de Grupos" phase
  const phase = await prisma.phase.findFirst({
    where: { competitionId: competition.id },
    include: { groups: true },
  });
  if (!phase) { console.error('No phase found'); process.exit(1); }

  console.log(`Competition: ${competition.name}`);
  console.log(`Phase: ${phase.name} (${phase.groups.length} groups)\n`);

  let totalCreated = 0;

  for (const group of phase.groups) {
    // Get teams in this group
    const compTeams = await prisma.competitionTeam.findMany({
      where: { competitionId: competition.id, groupId: group.id },
      include: { team: true },
    });

    if (compTeams.length !== 4) {
      console.log(`⚠️  ${group.name}: ${compTeams.length} teams (expected 4), skipping`);
      continue;
    }

    console.log(`📋 ${group.name}: ${compTeams.map(ct => ct.team.name).join(', ')}`);

    for (let day = 0; day < 3; day++) {
      const matchDate = MATCH_DAYS[day];
      const pairings = ROUND_ROBIN[day];

      for (const [homeIdx, awayIdx] of pairings) {
        const home = compTeams[homeIdx];
        const away = compTeams[awayIdx];

        // Check if match already exists
        const existing = await prisma.match.findFirst({
          where: {
            phaseId: phase.id,
            groupId: group.id,
            homeTeamId: home.teamId,
            awayTeamId: away.teamId,
          },
        });

        if (existing) {
          console.log(`   ↳ Exists: ${home.team.name} vs ${away.team.name}`);
          continue;
        }

        await prisma.match.create({
          data: {
            phaseId: phase.id,
            groupId: group.id,
            homeTeamId: home.teamId,
            awayTeamId: away.teamId,
            matchDate,
          },
        });
        totalCreated++;
        console.log(`   ✅ Day ${day + 1}: ${home.team.name} vs ${away.team.name}`);
      }
    }
  }

  console.log(`\n🏆 Done! Created ${totalCreated} matches.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
