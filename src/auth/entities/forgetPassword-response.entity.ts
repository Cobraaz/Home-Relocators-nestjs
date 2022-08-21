import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ForgetPasswordResponse {
  @Field(() => String)
  msg: string;
}
