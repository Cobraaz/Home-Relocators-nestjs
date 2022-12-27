import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCategoryInput {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => Boolean, { nullable: true })
  home?: boolean;

  @Field(() => Boolean, { nullable: true })
  commercial?: boolean;

  @Field(() => String, { nullable: true })
  parentCategoryId?: string;
}
