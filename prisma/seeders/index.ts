import { PrismaClient } from '@prisma/client';
import userSeeders from './userSeeders';

const prisma = new PrismaClient();

const main = async () => {
  try {
    console.log('Seeding start...');
    // ----------USERS--------------
    await prisma.user.deleteMany();
    console.log('Deleted records in user table');

    await prisma.$queryRaw`ALTER SEQUENCE user_id_seq RESTART WITH 1`;
    console.log('reset user auto increment to 1');

    await prisma.user.createMany({
      data: await userSeeders(),
    });
    console.log('Added category data');

    console.log('Seeding end...');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
