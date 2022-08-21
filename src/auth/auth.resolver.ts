import { RTInterceptor } from './interceptor/refresh-token.interceptor';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { plainToInstance } from 'class-transformer';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { GetCurrentUserUniqueID } from '../common/decorators/get-current-user-id.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginUserInput } from './dto/login-user.input';
import { SignUpUserInput } from './dto/signup-user.input';
import { RtGuard } from '../common/guards/rt.guard';
import { Tokens } from './types/tokens.type';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailActivationToken } from './types/emailActivationToken.type';
import { EmailActivationInput } from './dto/emailActivation.input';

@Resolver(() => Tokens)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User)
  async user(@Parent() tokens: Tokens) {
    const { uniqueID } = tokens;
    return plainToInstance(User, this.usersService.findOne({ uniqueID }), {
      excludeExtraneousValues: true,
    });
  }

  @Public()
  @Mutation(() => EmailActivationToken)
  signupLocal(
    @Args('signUpUserInput') signUpUserInput: SignUpUserInput,
  ): Promise<EmailActivationToken> {
    return this.authService.signupLocal(signUpUserInput);
  }

  @UseInterceptors(RTInterceptor)
  @Public()
  @Mutation(() => Tokens)
  activateAccount(@Args('token') token: EmailActivationInput): Promise<Tokens> {
    return this.authService.activateAccount(token);
  }

  @UseInterceptors(RTInterceptor)
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
