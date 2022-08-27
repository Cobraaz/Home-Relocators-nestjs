import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { SignUpUserInput } from './../../auth/dto/signup-user.input';

@InputType()
export class UpdateUserInput extends PartialType(SignUpUserInput) {
  @Field(() => String)
  @IsUUID('all')
  uniqueID: string;
}
