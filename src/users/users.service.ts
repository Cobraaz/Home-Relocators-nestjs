import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(obj: {
    id?: number;
    email?: string;
    uniqueID?: string;
  }): Promise<User> {
    if (obj.id) {
      return this.prisma.user.findUnique({
        where: {
          id: obj.id,
        },
      });
    } else if (obj.email) {
      return this.prisma.user.findUnique({
        where: {
          email: obj.email,
        },
      });
    } else if (obj.uniqueID) {
      return this.prisma.user.findUnique({
        where: {
          uniqueID: obj.uniqueID,
        },
      });
    }
  }

  async remove(obj: {
    id?: number;
    email?: string;
    uniqueID?: string;
  }): Promise<User> {
    if (obj.id) {
      return this.prisma.user.delete({
        where: {
          id: obj.id,
        },
      });
    } else if (obj.email) {
      return this.prisma.user.delete({
        where: {
          email: obj.email,
        },
      });
    } else if (obj.uniqueID) {
      return this.prisma.user.delete({
        where: {
          uniqueID: obj.uniqueID,
        },
      });
    }
  }

  update(updateUserInput: UpdateUserInput) {
    const { id, uniqueID, name, email, password } = updateUserInput;
    if (id || uniqueID || email)
      return this.prisma.user.update({
        where: {
          ...(id && { id }),
          ...(uniqueID && { uniqueID }),
          ...(email && { email }),
        },
        data: {
          ...(name && { name }),
          ...(password && { password }),
        },
      });
  }
}
