import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  GetCurrentUser,
  GetCurrentUserUniqueID,
  Public,
} from '../common/decorators';
import { AuthService } from './auth.service';
import { LoginUserInput } from './dto';
import { SignUpUserInput } from './dto/signup-user.input';
import { RtGuard } from '../common/guards/rt.guard';
import { Tokens } from './types';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

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
