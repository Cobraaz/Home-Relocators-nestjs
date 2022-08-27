import { InputType, Field, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/auth/decorators/match.decorator';
import { SignUpUserInput } from './../../auth/dto/signup-user.input';

@InputType()
export class UpdateUserInput extends PartialType(SignUpUserInput) {
  @Field(() => String)
  @IsUUID('all')
  uniqueID: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  @Match('password')
  passwordConfirm?: string;
}
