import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'robertobolla9@icloud.com' }
  });
  console.log('User direct dob:', user?.dob);
  console.log('User spread dob:', ({ ...user } as any).dob);
  console.log('User spread keys:', Object.keys({ ...user }));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
