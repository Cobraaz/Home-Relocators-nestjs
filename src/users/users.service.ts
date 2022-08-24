import { FIVE_MIN, ONE_HOUR } from './../common/constants';
import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { Role } from '@prisma/client';
import { FindOneUserInput } from './dto/findOne-user.input';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { CacheService } from '../cache/cache.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  selectUser = {
    id: true,
    uniqueID: true,
    name: true,
    email: true,
    role: true,
    avatar: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll(): Promise<User[]> {
    const cacheUsers = (await this.cache.get('users')) as User[];
    if (cacheUsers) {
      return cacheUsers;
    }

    const users = await this.prisma.user.findMany({
      select: this.selectUser,
    });
    if (users.length) {
      this.cache.set('users', users, FIVE_MIN);
      users.forEach((user) => {
        this.cache.set(`user_id_${user.id}`, user, ONE_HOUR);
        this.cache.set(`user_email_${user.email}`, user, ONE_HOUR);
        this.cache.set(`user_uniqueID_${user.uniqueID}`, user, ONE_HOUR);
      });
    }
    return users;
  }

  async findOne({ id, email, uniqueID }: FindOneUserInput) {
    try {
      if (id) {
        const cacheUser = await this.cache.get(`user_id_${id}`);
        if (cacheUser && Object.keys(cacheUser).length) {
          return cacheUser;
        }
        const user = await this.prisma.user.findUnique({
          where: {
            id,
          },
          select: this.selectUser,
        });
        this.cache.set(`user_id_${id}`, user, ONE_HOUR);
        return user;
      } else if (email) {
        const cacheUser = await this.cache.get(`user_email_${email}`);
        if (cacheUser && Object.keys(cacheUser).length) {
          return cacheUser;
        }
        const user = await this.prisma.user.findUnique({
          where: {
            email,
          },
          select: this.selectUser,
        });
        this.cache.set(`user_email_${email}`, user, ONE_HOUR);
        return user;
      } else if (uniqueID) {
        const cacheUser = await this.cache.get(`user_uniqueID_${uniqueID}`);
        if (cacheUser && Object.keys(cacheUser).length) {
          return cacheUser;
        }
        const user = await this.prisma.user.findUnique({
          where: {
            uniqueID,
          },
          select: this.selectUser,
        });
        this.cache.set(`user_uniqueID_${uniqueID}`, user, ONE_HOUR);
        return user;
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async remove({ id, email, uniqueID }: FindOneUserInput): Promise<User> {
    try {
      if (id) {
        this.cache.del(`user_id_${id}`);
        return this.prisma.user.delete({
          where: {
            id,
          },
          select: this.selectUser,
        });
      } else if (email) {
        this.cache.del(`user_email_${email}`);
        return this.prisma.user.delete({
          where: {
            email,
          },
          select: this.selectUser,
        });
      } else if (uniqueID) {
        this.cache.del(`user_uniqueID_${uniqueID}`);
        return this.prisma.user.delete({
          where: {
            uniqueID,
          },
          select: this.selectUser,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async update(updateUserInput: UpdateUserInput, user: JwtPayload) {
    const { id, uniqueID, name, email, password } = updateUserInput;
    if (user.role === Role.CUSTOMER) {
      let isAllowed = false;
      if (uniqueID && user.sub === uniqueID) {
        isAllowed = true;
      } else if (email && user.email === email) {
        isAllowed = true;
      } else if (id) {
        let userId = 0;
        const cacheUser = (await this.cache.get(`user_id_${id}`)) as User;
        if (cacheUser && Object.keys(cacheUser).length) {
          userId = cacheUser.id;
          return cacheUser;
        } else {
          const userIdDB = await this.prisma.user
            .findFirst({
              where: {
                id,
              },
              select: {
                id: true,
              },
            })
            .catch((error) => {
              if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                  throw new NotFoundException('User not found');
                }
              }
              throw error;
            });
          userId = userIdDB.id;
        }

        if (!!userId && userId === id) {
          isAllowed = true;
        }
      }
      if (!isAllowed) throw new ForbiddenException('Access Denied');
    }

    const updatedUser = await this.prisma.user
      .update({
        where: {
          ...(id && { id }),
          ...(uniqueID && { uniqueID }),
          ...(email && { email }),
        },
        data: {
          ...(name && { name }),
          ...(password && { password }),
        },
        select: this.selectUser,
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
      this.cache.set(`user_id_${updatedUser.id}`, updatedUser, ONE_HOUR);
      this.cache.set(`user_email_${updatedUser.email}`, updatedUser, ONE_HOUR);
      this.cache.set(
        `user_uniqueID_${updatedUser.uniqueID}`,
        updatedUser,
        ONE_HOUR,
      );
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
