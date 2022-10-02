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
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { UpdateUserPasswordInput } from './dto/update-user-password.input';

@Roles([Role.ADMIN])
@UseInterceptors(UserInterceptor)
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users', nullable: true })
  @CacheControl({ maxAge: 10 })
  findAll() {
    return this.usersService.findAll();
  }

  @Roles([Role.CUSTOMER, Role.MOVER])
  @Query(() => User, { name: 'user', nullable: true })
  @CacheControl({ maxAge: 10 })
  findOne(@GetCurrentUserId() id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => User)
  @CacheControl({ maxAge: 10 })
  adminFindOneUser(
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.findOne(findOneUserInput.id);
  }

  @Roles([Role.CUSTOMER, Role.MOVER])
  @Mutation(() => User)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @GetCurrentUserId() id: string,
  ) {
    return this.usersService.update(updateUserInput, id);
  }

  @Mutation(() => User)
  adminUpdateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.update(updateUserInput, findOneUserInput.id);
  }

  @Roles([Role.CUSTOMER, Role.MOVER])
  @Mutation(() => User)
  updateUserPassword(
    @Args('updateUserPasswordInput')
    updateUserPasswordInput: UpdateUserPasswordInput,
    @GetCurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updatePassword(updateUserPasswordInput, user);
  }

  @Mutation(() => User)
  removeUser(
    @GetCurrentUserId() id: string,
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.remove(id, findOneUserInput);
  }
}
