import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateCategoryInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  image?: string;

  @Field(() => Boolean, { nullable: true })
  home?: boolean;

  @Field(() => Boolean, { nullable: true })
  commercial?: boolean;

  @Field(() => String, { nullable: true })
  parentCategoryId?: string;

  @Field(() => Boolean, { nullable: true })
  disable?: boolean;
}
