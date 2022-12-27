import { ONE_HOUR } from './../common/constants';
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
import { Prisma } from '@prisma/client';
import { AdminUpdateUserInput } from './dto/adminUpdate-user.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async findAll(
    findAllUsersInput: FindAllUsersInput,
  ): Promise<FindAllUsersResponse> {
    const { role, search, skip, take } = findAllUsersInput;
    const whereCondition: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const users = await this.prisma.user.findMany({
      ...(skip > -1 &&
        take > -1 && {
          skip,
          take,
        }),

      where: whereCondition,
      orderBy: [
        {
          sequenceNumber: 'asc',
        },
      ],
      select: selectUser,
    });
    if (users.length) {
      users.forEach((user) => {
        if (!user.deletedBy) {
          this.cache.set(`user_${user.id}`, user, ONE_HOUR);
        }
      });
    }

    const totalCount = await this.prisma.user.count({
      where: whereCondition,
    });

    return { totalCount, users };
  }

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  async findOne(id: string, adminFindUser: boolean = false): Promise<User> {
    const cacheUser = await this.cache.get(`user_${id}`);
    if (cacheUser && Object.keys(cacheUser).length && !cacheUser.deletedBy) {
      return cacheUser;
    }
    const user = await this.prisma.user
      .findFirstOrThrow({
        where: {
          id,
          ...(!adminFindUser && { deleted: false }),
        },
        select: selectUser,
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
    if (user && !user.deletedBy) {
      this.cache.set(`user_${id}`, user, ONE_HOUR);
    }
    return user;
  }

  async remove(id: string, loggedInUserId?: string): Promise<User> {
    await this.findOne(id);
    try {
      if (id) {
        this.cache.del(`user_${id}`);
        this.cache.del(`hashedAT_${id}`);
        this.cache.del(`hashedRT_${id}`);
        const deletedUser = await this.prisma.user.update({
          where: {
            id,
          },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: loggedInUserId || id,
            hashedAt: null,
            hashedRt: null,
          },
          select: selectUser,
        });
        return deletedUser;
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async update(updateUserInput: UpdateUserInput, id: string) {
    await this.findOne(id);

    const updatedUser = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: updateUserInput,
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

  async adminUpdate(adminUpdateUserInput: AdminUpdateUserInput, id: string) {
    await this.findOne(id);

    const updatedUser = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: adminUpdateUserInput,
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
