// Seed 32 World Cup 2026 teams with flag images
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEAMS = [
  { name: 'Argentina', flag: '🇦🇷', flagUrl: 'https://flagcdn.com/w320/ar.png' },
  { name: 'Brasil', flag: '🇧🇷', flagUrl: 'https://flagcdn.com/w320/br.png' },
  { name: 'Francia', flag: '🇫🇷', flagUrl: 'https://flagcdn.com/w320/fr.png' },
  { name: 'Alemania', flag: '🇩🇪', flagUrl: 'https://flagcdn.com/w320/de.png' },
  { name: 'España', flag: '🇪🇸', flagUrl: 'https://flagcdn.com/w320/es.png' },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagUrl: 'https://flagcdn.com/w320/gb-eng.png' },
  { name: 'Portugal', flag: '🇵🇹', flagUrl: 'https://flagcdn.com/w320/pt.png' },
  { name: 'Países Bajos', flag: '🇳🇱', flagUrl: 'https://flagcdn.com/w320/nl.png' },
  { name: 'Italia', flag: '🇮🇹', flagUrl: 'https://flagcdn.com/w320/it.png' },
  { name: 'Croacia', flag: '🇭🇷', flagUrl: 'https://flagcdn.com/w320/hr.png' },
  { name: 'Uruguay', flag: '🇺🇾', flagUrl: 'https://flagcdn.com/w320/uy.png' },
  { name: 'Colombia', flag: '🇨🇴', flagUrl: 'https://flagcdn.com/w320/co.png' },
  { name: 'México', flag: '🇲🇽', flagUrl: 'https://flagcdn.com/w320/mx.png' },
  { name: 'Estados Unidos', flag: '🇺🇸', flagUrl: 'https://flagcdn.com/w320/us.png' },
  { name: 'Canadá', flag: '🇨🇦', flagUrl: 'https://flagcdn.com/w320/ca.png' },
  { name: 'Japón', flag: '🇯🇵', flagUrl: 'https://flagcdn.com/w320/jp.png' },
  { name: 'Corea del Sur', flag: '🇰🇷', flagUrl: 'https://flagcdn.com/w320/kr.png' },
  { name: 'Australia', flag: '🇦🇺', flagUrl: 'https://flagcdn.com/w320/au.png' },
  { name: 'Arabia Saudita', flag: '🇸🇦', flagUrl: 'https://flagcdn.com/w320/sa.png' },
  { name: 'Irán', flag: '🇮🇷', flagUrl: 'https://flagcdn.com/w320/ir.png' },
  { name: 'Senegal', flag: '🇸🇳', flagUrl: 'https://flagcdn.com/w320/sn.png' },
  { name: 'Marruecos', flag: '🇲🇦', flagUrl: 'https://flagcdn.com/w320/ma.png' },
  { name: 'Ghana', flag: '🇬🇭', flagUrl: 'https://flagcdn.com/w320/gh.png' },
  { name: 'Nigeria', flag: '🇳🇬', flagUrl: 'https://flagcdn.com/w320/ng.png' },
  { name: 'Camerún', flag: '🇨🇲', flagUrl: 'https://flagcdn.com/w320/cm.png' },
  { name: 'Ecuador', flag: '🇪🇨', flagUrl: 'https://flagcdn.com/w320/ec.png' },
  { name: 'Chile', flag: '🇨🇱', flagUrl: 'https://flagcdn.com/w320/cl.png' },
  { name: 'Paraguay', flag: '🇵🇾', flagUrl: 'https://flagcdn.com/w320/py.png' },
  { name: 'Serbia', flag: '🇷🇸', flagUrl: 'https://flagcdn.com/w320/rs.png' },
  { name: 'Suiza', flag: '🇨🇭', flagUrl: 'https://flagcdn.com/w320/ch.png' },
  { name: 'Dinamarca', flag: '🇩🇰', flagUrl: 'https://flagcdn.com/w320/dk.png' },
  { name: 'Polonia', flag: '🇵🇱', flagUrl: 'https://flagcdn.com/w320/pl.png' },
];

async function main() {
  // Find the first competition
  const competition = await prisma.competition.findFirst();
  if (!competition) {
    console.error('No competition found! Create one first.');
    process.exit(1);
  }
  
  console.log(`Seeding teams for: ${competition.name} (${competition.id})`);
  
  let created = 0;
  let linked = 0;
  
  for (const t of TEAMS) {
    // Check if team already exists
    let team = await prisma.team.findFirst({ where: { name: t.name } });
    
    if (!team) {
      team = await prisma.team.create({
        data: { name: t.name, flagUrl: t.flagUrl },
      });
      created++;
      console.log(`  ✅ Created: ${t.flag} ${t.name}`);
    } else {
      // Update flag URL if missing
      if (!team.flagUrl) {
        await prisma.team.update({ where: { id: team.id }, data: { flagUrl: t.flagUrl } });
      }
      console.log(`  ℹ️  Exists: ${t.flag} ${t.name}`);
    }
    
    // Link to competition if not already linked
    const existing = await prisma.competitionTeam.findFirst({
      where: { competitionId: competition.id, teamId: team.id },
    });
    
    if (!existing) {
      await prisma.competitionTeam.create({
        data: { competitionId: competition.id, teamId: team.id },
      });
      linked++;
    }
  }
  
  console.log(`\n🏆 Done! Created ${created} teams, linked ${linked} to "${competition.name}"`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
