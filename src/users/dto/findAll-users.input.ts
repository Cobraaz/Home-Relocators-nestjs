import { InputType, Field, Int } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsValidRole } from '../decorators/isValidRole.decorator';

@InputType()
export class FindAllUsersInput {
  @Field(() => String)
  @IsValidRole()
  @Transform(({ value }: { value: string }) => {
    return value.toUpperCase();
  })
  role: Role;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;
}
