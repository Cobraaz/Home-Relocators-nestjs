import { FIVE_MIN, ONE_HOUR } from './../common/constants';
import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../config/database/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { Role } from '@prisma/client';
import { FindOneUserInput } from './dto/findOne-user.input';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { CacheService } from '../config/cache/cache.service';
import { User } from './entities/user.entity';
import { selectUser } from 'src/common/helpers';

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
        this.cache.set(`user_${user.uniqueID}`, user, ONE_HOUR),
      );
    }
    return users;
  }

  async findOne({ uniqueID }: FindOneUserInput): Promise<User> {
    const cacheUser = await this.cache.get(`user_${uniqueID}`);
    if (cacheUser && Object.keys(cacheUser).length) {
      return cacheUser;
    }
    const user = await this.prisma.user
      .findFirstOrThrow({
        where: {
          uniqueID,
          deleted: false,
        },
        select: selectUser,
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });
    if (user) {
      this.cache.set(`user_${uniqueID}`, user, ONE_HOUR);
    }
    return user;
  }

  async remove(
    loggedInUserUniqueID: string,
    { uniqueID }: FindOneUserInput,
  ): Promise<User> {
    if (loggedInUserUniqueID === uniqueID) {
      throw new ForbiddenException('you cannot delete yourself');
    }
    await this.findOne({ uniqueID });
    try {
      if (uniqueID) {
        this.cache.del(`user_${uniqueID}`);
        this.cache.del(`hashedAT_${uniqueID}`);
        this.cache.del(`hashedRT_${uniqueID}`);
        return this.prisma.user.update({
          where: {
            uniqueID,
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
    const { uniqueID, name, password } = updateUserInput;
    if (user.role === Role.CUSTOMER || user.role === Role.MOVER) {
      let isAllowed = false;
      if (user.sub === uniqueID) {
        isAllowed = true;
      }
      if (!isAllowed) throw new ForbiddenException('Access Denied');
    }

    await this.findOne({ uniqueID });

    const updatedUser = await this.prisma.user
      .update({
        where: {
          uniqueID,
        },
        data: {
          ...(name && { name }),
          ...(password && { password }),
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
      this.cache.set(`user_${updatedUser.uniqueID}`, updatedUser, ONE_HOUR);
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
