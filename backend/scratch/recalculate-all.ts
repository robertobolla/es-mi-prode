import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScoringService } from '../src/scoring/scoring.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scoringService = app.get(ScoringService);
  const prisma = app.get(PrismaService);

  const activeCompetition = await prisma.competition.findFirst({
    where: { active: true },
  });

  if (!activeCompetition) {
    console.log('No active competition found!');
    await app.close();
    return;
  }

  console.log(`Recalculating global ranking for active competition: ${activeCompetition.name} (${activeCompetition.id})...`);
  await scoringService.recalculateGlobalRanking(activeCompetition.id);
  console.log('Done!');
  await app.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
