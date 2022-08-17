import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Public } from 'src/common/decorators';
import { AuthService } from './auth.service';
import { LoginUserInput } from './dto';
import { Tokens } from './types';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => Tokens)
  signinLocal(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
  ): Promise<Tokens> {
    return this.authService.signinLocal(loginUserInput);
  }
}
