import { ResetPasswordInput } from './dto/resetPassword.input';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Mutation,
  Query,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { GetCurrentUserId } from '../common/decorators/get-current-user-id.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginUserInput } from './dto/login-user.input';
import { SignUpUserInput } from './dto/signup-user.input';
import { RtGuard } from '../common/guards/rt.guard';
import { TokensResponse } from './entities/token.entity-response';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailActivationResponse } from './entities/emailActivation-response.entity';
import { EmailActivationInput } from './dto/emailActivation.input';
import { CacheControl } from 'nestjs-gql-cache-control';
import { ForgetPasswordResponse } from './entities/forgetPassword-response.entity';

@Resolver(() => TokensResponse)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User)
  @CacheControl({ maxAge: 20 })
  async user(@Parent() tokens: TokensResponse) {
    const { id } = tokens;
    return this.usersService.findOne(id);
  }

  @Public()
  @Mutation(() => EmailActivationResponse)
  signupLocal(
    @Args('signUpUserInput') signUpUserInput: SignUpUserInput,
  ): Promise<EmailActivationResponse> {
    return this.authService.signupLocal(signUpUserInput);
  }

  @Public()
  @Mutation(() => TokensResponse)
  activateAccount(
    @Args('emailActivationInput') emailActivationInput: EmailActivationInput,
  ): Promise<TokensResponse> {
    return this.authService.activateAccount(emailActivationInput);
  }

  @Public()
  @Mutation(() => TokensResponse)
  signinLocal(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
  ): Promise<TokensResponse> {
    return this.authService.signinLocal(loginUserInput);
  }

  @Mutation(() => Boolean)
  logout(@GetCurrentUserId() id: string): Promise<boolean> {
    return this.authService.logout(id);
  }

  @UseGuards(RtGuard)
  @Mutation(() => TokensResponse)
  @Public()
  refreshTokens(
    @GetCurrentUserId() id: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<TokensResponse> {
    console.log('refreshToken', refreshToken);
    return this.authService.refreshTokens(id, refreshToken);
  }

  @Mutation(() => ForgetPasswordResponse)
  @Public()
  forgetPassword(
    @Args('email') email: string,
  ): Promise<ForgetPasswordResponse> {
    return this.authService.forgetPassword(email);
  }

  @Public()
  @Mutation(() => TokensResponse)
  resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
  ): Promise<ForgetPasswordResponse> {
    return this.authService.resetPassword(resetPasswordInput);
  }

  @Public()
  @Query(() => String)
  hello(): string {
    return 'Hello Anuj';
  }
}
