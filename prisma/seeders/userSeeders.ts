import { Prisma, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import argon from 'argon2';

const userSeeders = async () => {
  let users = [];
  const usersData: Prisma.UserCreateInput[] = [
    {
      name: 'Test Admin',
      email: 'testadmin@gmail.com',
      password: 'Anuj@1234',
      role: Role.ADMIN,
    },
    {
      name: 'Test Customer',
      email: 'testcustomer@gmail.com',
      password: 'Anuj@1234',
      role: Role.CUSTOMER,
    },
    {
      name: 'Test Mover',
      email: 'testmover@gmail.com',
      password: 'Anuj@1234',
      role: Role.MOVER,
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

  for (let i = 0; i < 70; i++) {
    const password = await argon.hash(faker.internet.password());
    const roles = Object.values(Role);
    const randomIndex = Math.floor(Math.random() * roles.length);
    const randomRole = roles[randomIndex];

    users.push({
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: password,
      role: randomRole,
      avatar: faker.image.avatar(),
    });
  }
  return users;
};

export default userSeeders;
