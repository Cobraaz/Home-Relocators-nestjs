import { FIVE_MIN, ONE_HOUR } from './../common/constants';
import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
import { FindAllUsersInput } from './dto/findAll-users.input';
import { FindAllUsersResponse } from './entities/findAll-users-response.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async findAll(
    findAllUsersInput: FindAllUsersInput,
  ): Promise<FindAllUsersResponse> {
    console.log('findAllUsersInput', findAllUsersInput);
    const users = await this.prisma.user.findMany({
      skip: findAllUsersInput.skip,
      take: findAllUsersInput.take,
      where: {
        deleted: false,
        role: findAllUsersInput.role,
      },
      orderBy: [
        {
          index: 'asc',
        },
      ],
      select: selectUser,
    });
    if (users.length) {
      users.forEach((user) =>
        this.cache.set(`user_${user.id}`, user, ONE_HOUR),
      );
    }

    const totalCount = await this.prisma.user.count();

    return { totalCount, users };
  }

  async findOne(id: string): Promise<User> {
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
    await this.findOne(id);
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

  async update(updateUserInput: UpdateUserInput, id: string) {
    const { name, avatar } = updateUserInput;

    await this.findOne(id);

    const updatedUser = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: {
          ...(name && { name }),
          ...(avatar && { avatar }),
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
