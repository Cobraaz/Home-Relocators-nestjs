import { Field, ObjectType } from '@nestjs/graphql';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../../users/entities';

@ObjectType()
export class Tokens {
  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;

  uniqueID: string;

  @Field(() => User)
  user?: PrismaUser;
}
