import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Category } from './category.entity';

@ObjectType()
export class FindAllCategoryResponse {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [Category], { nullable: true })
  categories?: Category[];
}
