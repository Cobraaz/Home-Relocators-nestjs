import { customError } from '../utils/CustomError';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from '@prisma/client';
import argon from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput): Promise<User | void> {
    const findEmail = await this.prisma.user.findFirst({
      where: {
        email: createUserInput.email,
      },
    });
    if (findEmail) {
      return customError([
        {
          property: 'email',
          constraints: 'Email already exists',
        },
      ]);
    }
    const password = await argon.hash(createUserInput.password);
    return this.prisma.user.create({
      data: { ...createUserInput, password },
    });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // update(id: number, updateUserInput: UpdateUserInput) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
