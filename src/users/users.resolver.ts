import { JwtPayload } from './../auth/types/jwtPayload.type';
import { UseInterceptors } from '@nestjs/common';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserInterceptor } from './interceptor/user.interceptor';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Roles } from '../common/decorators/role.decorator';
import { Role } from '@prisma/client';
import { UpdateUserInput } from './dto/update-user.input';
import { CacheControl } from 'nestjs-gql-cache-control';
import { FindOneUserInput } from './dto/findOne-user.input';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';

@Roles([Role.ADMIN])
@UseInterceptors(UserInterceptor)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users', nullable: true })
  @CacheControl({ maxAge: 20 })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user', nullable: true })
  @CacheControl({ maxAge: 10 })
  findOne(@Args('findOneUserInput') findOneUserInput: FindOneUserInput) {
    return this.usersService.findOne(findOneUserInput);
  }

  @Roles([Role.CUSTOMER, Role.SELLER])
  @Mutation(() => User)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(updateUserInput, user);
  }

  @Mutation(() => User)
  removeUser(
    @GetCurrentUser('role') role: string,
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.remove(findOneUserInput);
  }
}
