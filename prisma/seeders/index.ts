import { PrismaClient } from '@prisma/client';
import categorySeeders from './categorySeeders';
import userSeeders from './userSeeders';

const prisma = new PrismaClient();

const main = async () => {
  try {
    console.log('Seeding start...');

    // ----------EMPTY TABLE DATA--------------
    await prisma.category.deleteMany();
    console.log('Deleted records in category table');
    await prisma.user.deleteMany();
    console.log('Deleted records in user table');

    // ----------USERS--------------
    await prisma.$queryRaw`ALTER SEQUENCE "user_sequenceNumber_seq" RESTART WITH 1`;
    console.log('reset user auto increment to 1');

    await prisma.user.createMany({
      data: await userSeeders(),
    });
    console.log('Added user data');

    // ----------CATEGORY--------------
    await prisma.category.deleteMany();
    console.log('Deleted records in category table');

    await prisma.$queryRaw`ALTER SEQUENCE "category_sequenceNumber_seq" RESTART WITH 1`;
    console.log('reset category auto increment to 1');

    await categorySeeders(prisma);
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
