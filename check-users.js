const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const p = new PrismaClient();
  const users = await p.user.findMany({
    select: { username: true, email: true, role: true, isActive: true, password: true }
  });
  
  for (const u of users) {
    const testMyo = await bcrypt.compare('myo123', u.password);
    const testAdmin = await bcrypt.compare('admin123', u.password);
    const testYu = await bcrypt.compare('yu123', u.password);
    console.log(`${u.username} | ${u.email} | ${u.role} | active:${u.isActive} | myo123:${testMyo} | admin123:${testAdmin} | yu123:${testYu}`);
  }
  
  await p.$disconnect();
}

main().catch(console.error);
