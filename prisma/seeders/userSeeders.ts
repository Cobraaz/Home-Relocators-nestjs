import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import argon from 'argon2';

const userSeeders = async () => {
  let users = [];
  const usersData: Prisma.UserCreateInput[] = [
    {
      name: 'Test Admin',
      email: 'testadmin@gmail.com',
      password: 'Anuj@1234',
      role: 'ADMIN',
    },
    {
      name: 'Test Customer',
      email: 'testcustomer@gmail.com',
      password: 'Anuj@1234',
      role: 'CUSTOMER',
    },
    {
      name: 'Test Mover',
      email: 'testmover@gmail.com',
      password: 'Anuj@1234',
      role: 'MOVER',
    },
  ];

  users = await Promise.all(
    usersData.map(async ({ password, ...rest }) => {
      password = await argon.hash(password);
      return {
        ...rest,
        password,
      };
    }),
  );

  for (let i = 0; i < 7; i++) {
    const password = await argon.hash(faker.internet.password());
    users.push({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: password,
    });
  }
  return users;
};

export default userSeeders;
