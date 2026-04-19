const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Admin user (Dev Admin)
  await prisma.user.upsert({
    where: { email: 'admin@unitech.sg' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@unitech.sg',
      name: 'Admin User',
      displayName: 'Admin',
      password: hashedPassword,
      role: 'dev_admin',
    },
  });

  // Production Admin - Myo Min
  const myoPassword = await bcrypt.hash('myo123', 10);
  await prisma.user.upsert({
    where: { email: 'myo@unitech.sg' },
    update: {},
    create: {
      username: 'myoadmin',
      email: 'myo@unitech.sg',
      name: 'Myo Min',
      displayName: 'Myo Min',
      password: myoPassword,
      role: 'dev_admin',
    },
  });

  // Financial Controller - Yulius Herman
  const yuPassword = await bcrypt.hash('yu123', 10);
  await prisma.user.upsert({
    where: { email: 'yulius@unitech.sg' },
    update: {},
    create: {
      username: 'yuadmin',
      email: 'yulius@unitech.sg',
      name: 'Yulius Herman',
      displayName: 'Yulius Herman',
      password: yuPassword,
      role: 'finance_controller',
    },
  });

  console.log('✅ Database seeded successfully — users only (production mode)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
