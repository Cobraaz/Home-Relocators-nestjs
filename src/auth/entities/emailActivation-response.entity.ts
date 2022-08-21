import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmailActivationResponse {
  @Field(() => String)
  msg: string;
}
