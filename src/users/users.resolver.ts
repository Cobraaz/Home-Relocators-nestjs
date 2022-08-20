import { UseInterceptors } from '@nestjs/common';
import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { UserInterceptor } from './interceptor';
import { UsersService } from './users.service';
import { User } from './entities';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';
import { UpdateUserInput } from './dto';
import { CacheControl } from 'nestjs-gql-cache-control';

@Roles(Role.ADMIN)
@UseInterceptors(UserInterceptor)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  @CacheControl({ maxAge: 10 })
  findAll() {
    console.log("first")
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(
    @Args('id', { type: () => Int, nullable: true }) id?: number | null,
    @Args('email', { type: () => String, nullable: true })
    email?: string | null,
    @Args('uniqueID', { type: () => String, nullable: true })
    uniqueID?: string | null,
  ) {
    return this.usersService.findOne({ id, email, uniqueID });
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput);
  }

  // @Roles(Role.ADMIN)
  @Mutation(() => User)
  removeUser(
    @Args('id', { type: () => Int, nullable: true }) id?: number | null,
    @Args('email', { type: () => String, nullable: true })
    email?: string | null,
    @Args('uniqueID', { type: () => String, nullable: true })
    uniqueID?: string | null,
  ) {
    return this.usersService.remove({ id, email, uniqueID });
  }
}
