import { Field, ObjectType } from '@nestjs/graphql';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../../users/entities/user.entity';
// import { User } from '@prisma/client';
// export type Tokens = {
//   access_token: string;
//   refresh_token: string;
//   user: User;
// };

@ObjectType()
export class Tokens {
  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;

  @Field(() => User)
  user: PrismaUser;
}
