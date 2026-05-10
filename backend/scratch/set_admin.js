const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'bblasivan@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`❌ No se encontró ningún usuario con el correo: ${email}`);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { isAdmin: true }
  });

  console.log(`✅ Usuario actualizado con éxito:`);
  console.log(`   ID: ${updatedUser.id}`);
  console.log(`   Username: ${updatedUser.username}`);
  console.log(`   Email: ${updatedUser.email}`);
  console.log(`   isAdmin: ${updatedUser.isAdmin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
