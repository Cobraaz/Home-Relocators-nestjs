import { ObjectType, Field, registerEnumType, ID, Int } from '@nestjs/graphql';

enum Role {
  CUSTOMER = 'CUSTOMER',
  MOVER = 'MOVER',
  ADMIN = 'ADMIN',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'The Different Types of users.',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  index: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  role: string;

  @Field(() => String)
  avatar: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
