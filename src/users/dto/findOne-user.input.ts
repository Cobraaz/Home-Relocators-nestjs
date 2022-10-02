import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class FindOneUserInput {
  @Field(() => String)
  @IsUUID('all')
  id: string;
}
