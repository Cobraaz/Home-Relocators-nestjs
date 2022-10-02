import { ObjectType, Field, registerEnumType, ID, Int } from '@nestjs/graphql';
import { Expose, Transform } from 'class-transformer';

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
  @Expose()
  id: string;

  @Field(() => Int)
  @Expose()
  index: number;

  @Field(() => String)
  @Expose()
  name: string;

  @Field(() => String)
  @Expose()
  email: string;

  @Field(() => String)
  @Expose()
  role: string;

  @Field(() => String)
  @Expose()
  avatar: string;

  @Field(() => String)
  @Transform(({ value }) => {
    return new Date(value).toLocaleString();
  })
  @Expose()
  createdAt: Date;

  @Field(() => String)
  @Transform(({ value }) => {
    return new Date(value).toLocaleString();
  })
  @Expose()
  updatedAt: Date;
}
