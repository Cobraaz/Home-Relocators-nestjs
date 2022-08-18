import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import {
  GetCurrentUser,
  GetCurrentUserUniqueID,
  Public,
} from '../common/decorators';
import { AuthService } from './auth.service';
import { LoginUserInput } from './dto';
import { SignUpUserInput } from './dto';
import { RtGuard } from '../common/guards';
import { Tokens } from './types';
import { User } from 'src/users/entities';
import { UsersService } from '../users/users.service';

@Resolver(() => Tokens)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User)
  async user(@Parent() tokens: Tokens, @Context('req') req: any) {
    const { uniqueID } = tokens;
    return plainToInstance(User, this.usersService.findOne({ uniqueID }), {
      excludeExtraneousValues: true,
    });
  }

  @Public()
  @Mutation(() => Tokens)
  signupLocal(
    @Args('signUpUserInput') signUpUserInput: SignUpUserInput,
  ): Promise<Tokens | void> {
    return this.authService.signupLocal(signUpUserInput);
  }

  @Public()
  @Mutation(() => Tokens)
  signinLocal(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
  ): Promise<Tokens> {
    return this.authService.signinLocal(loginUserInput);
  }

  @Mutation(() => Boolean)
  logout(@GetCurrentUserUniqueID() uniqueID: string): Promise<boolean> {
    return this.authService.logout(uniqueID);
  }

  @Public()
  @UseGuards(RtGuard)
  @Mutation(() => Tokens)
  refreshTokens(
    @GetCurrentUserUniqueID() uniqueID: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(uniqueID, refreshToken);
  }
}
