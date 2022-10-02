import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field(() => String)
  @IsUUID('all')
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;
}
