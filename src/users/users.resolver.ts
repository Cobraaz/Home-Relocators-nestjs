import { JwtPayload } from './../auth/types/jwtPayload.type';
import {
  Resolver,
  Query,
  Args,
  Mutation,
  Parent,
  ResolveField,
} from '@nestjs/graphql';
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
import { FindAllUsersInput } from './dto/findAll-users.input';
import { FindAllUsersResponse } from './entities/findAll-users-response.entity';
import { AdminUpdateUserInput } from './dto/adminUpdate-user.input';

@Roles([Role.ADMIN])
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveField(() => User)
  async deletedBy(@Parent() user: User) {
    console.log('<<<<<<<<<<<-first->>>>>');
    const { deletedBy } = user;
    if (deletedBy) {
      return this.usersService.findOne(deletedBy, true);
    }
    return null;
  }

  @Query(() => FindAllUsersResponse, { name: 'users' })
  @CacheControl({ maxAge: 10 })
  findAll(@Args('findAllUsersInput') findAllUsersInput: FindAllUsersInput) {
    return this.usersService.findAll(findAllUsersInput);
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
    @Args('adminUpdateUserInput') adminUpdateUserInput: AdminUpdateUserInput,
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.adminUpdate(
      adminUpdateUserInput,
      findOneUserInput.id,
    );
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

  @Roles([Role.CUSTOMER, Role.MOVER])
  @Mutation(() => User)
  removeUser(@GetCurrentUserId() id: string) {
    return this.usersService.remove(id);
  }

  @Mutation(() => User)
  adminRemoveUser(
    @GetCurrentUserId() id: string,
    @Args('findOneUserInput') findOneUserInput: FindOneUserInput,
  ) {
    return this.usersService.remove(findOneUserInput.id, id);
  }
}
