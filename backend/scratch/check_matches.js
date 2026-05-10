const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matchCount = await prisma.match.count({
    where: { phase: { competitionId: '01613f24-38fb-4617-b110-0e5c243a5bd5' } }
  });

  console.log('Match count for competition:', matchCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
