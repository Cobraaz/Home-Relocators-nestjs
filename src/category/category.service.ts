import { FindAllCategoryResponse } from './entities/findAll-category-response.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { selectCategory } from 'src/common/helpers';
import { PrismaService } from 'src/config/database/prisma/prisma.service';
import { customError } from 'src/utils/CustomError';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryInput: CreateCategoryInput, userId: string) {
    const { name } = createCategoryInput;

    const findCategory = await this.prisma.category.findFirst({
      where: {
        name: { equals: name.toLowerCase(), mode: 'insensitive' },
      },
      select: { name: true },
    });

    if (findCategory) {
      customError([
        {
          property: 'name',
          constraints: 'Name already exists',
        },
      ]);
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryInput,
        name: name.toLowerCase(),
        userId,
      },
      select: selectCategory,
    });

    return category;
  }

  async findAll(): Promise<FindAllCategoryResponse> {
    const categories = await this.prisma.category.findMany({
      where: {
        parentCategoryId: null,
      },
      select: selectCategory,
    });

    const totalCount = await this.prisma.user.count();
    return {
      totalCount,
      categories,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  async findOne(id: string, userId: string, adminFindUser: boolean = false) {
    const category = await this.prisma.category
      .findFirstOrThrow({
        where: {
          id,
          ...(!adminFindUser && { deleted: false, disable: false }),
          userId,
        },
        select: {
          ...selectCategory,
          ...(!adminFindUser && {
            childCategory: {
              where: {
                disable: false,
              },
            },
          }),
        },
      })
      .catch(() => {
        throw new NotFoundException('User not found');
      });

    console.log('category', category);

    return category;
  }

  async update(
    updateCategoryInput: UpdateCategoryInput,
    categoryId: string,
    userId: string,
  ) {
    await this.findOne(categoryId, userId);

    const updatedCategory = await this.prisma.category
      .update({
        where: {
          id: categoryId,
        },
        data: updateCategoryInput,
        select: selectCategory,
      })
      .catch((error) => {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundException('Category not found');
          }
        }
        throw error;
      });

    return updatedCategory;
  }

  async remove(categoryId: string, userId: string) {
    await this.findOne(categoryId, userId);

    const deletedCategory = await this.prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
      select: selectCategory,
    });

    return deletedCategory;
  }
}
