import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User, Role } from '@prisma/client';
import { FindOneUserInput } from './dto/findOne-user.input';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async findAll(): Promise<User[]> {
    console.log(await this.cache.get('name'));
    return this.prisma.user.findMany();
  }

  async findOne({ id, email, uniqueID }: FindOneUserInput) {
    console.log(await this.cache.set('name', email));
    try {
      if (id) {
        return this.prisma.user.findUnique({
          where: {
            id,
          },
        });
      } else if (email) {
        return this.prisma.user.findUnique({
          where: {
            email,
          },
        });
      } else if (uniqueID) {
        return this.prisma.user.findUnique({
          where: {
            uniqueID,
          },
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }

  async remove({ id, email, uniqueID }: FindOneUserInput): Promise<User> {
    try {
      if (id) {
        return this.prisma.user.delete({
          where: {
            id,
          },
        });
      } else if (email) {
        return this.prisma.user.delete({
          where: {
            email,
          },
        });
      } else if (uniqueID) {
        return this.prisma.user.delete({
          where: {
            uniqueID,
          },
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
        const userId = await this.prisma.user
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
        if (userId && userId.id && userId.id === id) {
          isAllowed = true;
        }
      }
      if (!isAllowed) throw new ForbiddenException('Access Denied');
    }
    try {
      return this.prisma.user
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
        })
        .catch((error) => {
          if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              throw new NotFoundException('User not found');
            }
          }
          throw error;
        });
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
