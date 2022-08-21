import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class EmailActivationInput {
  @Field(() => String)
  @IsString()
  activation_token: string;
}
