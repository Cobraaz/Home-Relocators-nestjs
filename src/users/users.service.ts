import { FIVE_MIN, ONE_HOUR } from './../common/constants';
import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import argon from 'argon2';

import { PrismaService } from '../config/database/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { FindOneUserInput } from './dto/findOne-user.input';
import { CacheService } from '../config/cache/cache.service';
import { User } from './entities/user.entity';
import { selectUser } from 'src/common/helpers';
import { UpdateUserPasswordInput } from './dto/update-user-password.input';
import { customError } from 'src/utils/CustomError';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async findAll(): Promise<User[]> {
    const cacheUsers = (await this.cache.get('users')) as User[];
    if (cacheUsers) {
      return cacheUsers;
    }

    const users = await this.prisma.user.findMany({
      where: { deleted: false },
      select: selectUser,
    });
    if (users.length) {
      this.cache.set('users', users, FIVE_MIN);
      users.forEach((user) =>
        this.cache.set(`user_${user.id}`, user, ONE_HOUR),
      );
    }
    return users;
  }

  async findOne({ id }: FindOneUserInput): Promise<User> {
    const cacheUser = await this.cache.get(`user_${id}`);
    if (cacheUser && Object.keys(cacheUser).length) {
      return cacheUser;
    }
    const user = await this.prisma.user
      .findFirstOrThrow({
        where: {
          id,
          deleted: false,
        },
        select: selectUser,
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
    if (user) {
      this.cache.set(`user_${id}`, user, ONE_HOUR);
    }
    return user;
  }

  async remove(
    loggedInUserId: string,
    { id }: FindOneUserInput,
  ): Promise<User> {
    if (loggedInUserId === id) {
      throw new ForbiddenException('you cannot delete yourself');
    }
    await this.findOne({ id });
    try {
      if (id) {
        this.cache.del(`user_${id}`);
        this.cache.del(`hashedAT_${id}`);
        this.cache.del(`hashedRT_${id}`);
        return this.prisma.user.update({
          where: {
            id,
          },
          data: {
            deleted: true,
          },
          select: selectUser,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async update(updateUserInput: UpdateUserInput, user: JwtPayload) {
    const { id, name } = updateUserInput;
    if (user.role === Role.CUSTOMER || user.role === Role.MOVER) {
      let isAllowed = false;
      if (user.sub === id) {
        isAllowed = true;
      }
      if (!isAllowed) throw new ForbiddenException('Access Denied');
    }

    await this.findOne({ id });

    const updatedUser = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: {
          ...(name && { name }),
        },
        select: selectUser,
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('User not found');
          }
        }
        throw error;
      });

    try {
      this.cache.set(`user_${updatedUser.id}`, updatedUser, ONE_HOUR);
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async updatePassword(
    updateUserPasswordInput: UpdateUserPasswordInput,
    user: JwtPayload,
  ) {
    const { sub: id } = user;
    const { currentPassword, newPassword } = updateUserPasswordInput;

    const findUser = await this.prisma.user
      .findFirstOrThrow({
        where: {
          id,
          deleted: false,
        },
        select: {
          password: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });

    const checkPassword = await argon.verify(
      findUser.password,
      currentPassword,
    );

    if (!checkPassword) {
      customError([
        {
          property: 'currentPassword',
          constraints: 'Password Incorrect',
        },
      ]);
    }

    const password = await argon.hash(newPassword);

    const updatedUser = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: {
          password,
        },
        select: selectUser,
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('User not found');
          }
        }
        throw error;
      });

    try {
      this.cache.set(`user_${updatedUser.id}`, updatedUser, ONE_HOUR);
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
