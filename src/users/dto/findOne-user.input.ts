import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

@InputType()
export class FindOneUserInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  id?: number;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  uniqueID?: string;
}
