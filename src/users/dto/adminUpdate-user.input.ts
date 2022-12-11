import { InputType, Field } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsValidRole } from '../decorators/isValidRole.decorator';

@InputType()
export class AdminUpdateUserInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsValidRole()
  @Transform(({ value }: { value?: string }) => {
    return value?.toUpperCase();
  })
  role?: Role;

  @Field(() => String, { nullable: true })
  avatar?: string;
}
