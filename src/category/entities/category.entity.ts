import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { User as PrismaUser, Category as PrismaCategory } from '@prisma/client';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  sequenceNumber: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  image: string;

  @Field(() => Boolean)
  home: boolean;

  @Field(() => Boolean)
  commercial: boolean;

  @Field(() => User)
  user?: PrismaUser;

  @Field(() => Category, { nullable: true })
  parentCategory?: PrismaCategory;

  @Field(() => Boolean)
  disable: boolean;

  @Field(() => Boolean)
  deleted: boolean;

  @Field(() => User, { nullable: true })
  deletedBy?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  userId: string;
  parentCategoryId: string;
}
