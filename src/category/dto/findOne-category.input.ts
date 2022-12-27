import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class FindOneCategoryInput {
  @Field(() => String)
  @IsUUID('all')
  id: string;
}
