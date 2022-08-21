import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmailActivationToken {
  @Field(() => String)
  msg: string;
}
