import { Field, ObjectType } from '@nestjs/graphql';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class TokensResponse {
  @Field(() => String)
  access_token: string;

  @Field(() => User)
  user?: PrismaUser;

  @Field(() => String, { nullable: true })
  msg?: string;

  id: string;
  refresh_token: string;
}
