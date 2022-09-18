import { ResetPasswordInput } from './dto/resetPassword.input';
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
import { TokensResponse } from './entities/token.entity-response';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { EmailActivationResponse } from './entities/emailActivation-response.entity';
import { EmailActivationInput } from './dto/emailActivation.input';
import { CacheControl } from 'nestjs-gql-cache-control';
import { ForgetPasswordResponse } from './entities/forgetPassword-response.entity';
import { RTClearInterceptor } from './interceptor/refresh-token-clear.interceptor';

@Resolver(() => TokensResponse)
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User)
  @CacheControl({ maxAge: 20 })
  async user(@Parent() tokens: TokensResponse) {
    const { uniqueID } = tokens;

    return plainToInstance(User, this.usersService.findOne({ uniqueID }), {
      excludeExtraneousValues: true,
    });
  }

  @Public()
  @Mutation(() => EmailActivationResponse)
  signupLocal(
    @Args('signUpUserInput') signUpUserInput: SignUpUserInput,
  ): Promise<EmailActivationResponse> {
    return this.authService.signupLocal(signUpUserInput);
  }

  @UseInterceptors(RTInterceptor)
  @Public()
  @Mutation(() => TokensResponse)
  activateAccount(
    @Args('emailActivationInput') emailActivationInput: EmailActivationInput,
  ): Promise<TokensResponse> {
    console.log('first first');
    return this.authService.activateAccount(emailActivationInput);
  }

  @UseInterceptors(RTInterceptor)
  @Public()
  @Mutation(() => TokensResponse)
  signinLocal(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
  ): Promise<TokensResponse> {
    return this.authService.signinLocal(loginUserInput);
  }

  @UseInterceptors(RTClearInterceptor)
  @Mutation(() => Boolean)
  logout(@GetCurrentUserUniqueID() uniqueID: string): Promise<boolean> {
    return this.authService.logout(uniqueID);
  }

  @UseGuards(RtGuard)
  @Mutation(() => TokensResponse)
  @Public()
  refreshTokens(
    @GetCurrentUserUniqueID() uniqueID: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Promise<TokensResponse> {
    return this.authService.refreshTokens(uniqueID, refreshToken);
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
}
