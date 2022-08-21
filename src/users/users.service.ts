import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from '@prisma/client';
import { FindOneUserInput } from './dto/findOne-user.input';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

type OptionalFlags<T> = {
  [Property in keyof T]?: boolean;
};
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(
    { id, email, uniqueID }: FindOneUserInput,
    select: OptionalFlags<User> = {},
  ) {
    try {
      if (id) {
        return this.prisma.user.findUnique({
          where: {
            id,
          },
          ...(select && { select }),
        });
      } else if (email) {
        return this.prisma.user.findUnique({
          where: {
            email,
          },
          ...(select && { select }),
        });
      } else if (uniqueID) {
        return this.prisma.user.findUnique({
          where: {
            uniqueID,
          },
          ...(select && { select }),
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

  update(updateUserInput: UpdateUserInput) {
    try {
      const { id, uniqueID, name, email, password } = updateUserInput;

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
      console.log(error);
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
}
