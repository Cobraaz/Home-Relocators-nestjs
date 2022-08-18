import { Injectable } from '@nestjs/common';
import { customError } from '../utils/CustomError';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserInput } from './dto';
import { User } from '@prisma/client';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  findOne(obj: {
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

  // update(id: number, updateUserInput: UpdateUserInput) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
