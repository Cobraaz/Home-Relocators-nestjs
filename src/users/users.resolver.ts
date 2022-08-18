import { UseInterceptors } from '@nestjs/common';
import { Resolver, Query,  Args, Int } from '@nestjs/graphql';
import { UserInterceptor } from './interceptor';
import { UsersService } from './users.service';
import { User } from './entities';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

@UseInterceptors(UserInterceptor)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.SELLER)
  @Query(() => [User], { name: 'users' })
  findAll() {
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

  // @Mutation(() => User)
  // updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
  //   return this.usersService.update(updateUserInput.id, updateUserInput);
  // }

  // @Mutation(() => User)
  // removeUser(@Args('id', { type: () => Int }) id: number) {
  //   return this.usersService.remove(id);
  // }
}
