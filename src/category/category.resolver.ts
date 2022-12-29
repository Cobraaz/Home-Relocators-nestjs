import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { UsersService } from 'src/users/users.service';
import { CategoryService } from './category.service';
import { CreateCategoryInput } from './dto/create-category.input';
import { FindOneCategoryInput } from './dto/findOne-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { FindAllCategoryResponse } from './entities/findAll-category-response.entity';
import { Category } from './entities/category.entity';
import { CacheControl } from 'nestjs-gql-cache-control';

@Roles([Role.ADMIN])
@Resolver(() => Category)
export class CategoryResolver {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => Category)
  async user(@Parent() category: Category) {
    const { userId } = category;
    if (userId) {
      return this.usersService.findOne(userId);
    }
    return null;
  }

  @ResolveField(() => Category)
  async parentCategory(@Parent() category: Category) {
    const { parentCategoryId, userId } = category;
    if (parentCategoryId) {
      return this.categoryService.findOne(parentCategoryId, userId);
    }
    return null;
  }

  @ResolveField(() => Category)
  async deletedBy(@Parent() category: Category) {
    const { deletedBy } = category;
    if (deletedBy) {
      return this.usersService.findOne(deletedBy, true);
    }
    return null;
  }

  @Mutation(() => Category)
  createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
    @GetCurrentUserId() id: string,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryInput, id);
  }

  @Query(() => FindAllCategoryResponse, { name: 'categories' })
  @CacheControl({ maxAge: 10 })
  findAll(@Args('isSubCategories') isSubCategories: boolean) {
    return this.categoryService.findAll(isSubCategories);
  }

  @Roles([Role.CUSTOMER, Role.MOVER])
  @Query(() => Category, { name: 'category' })
  findOne(
    @Args('findOneCategoryInput') findOneCategoryInput: FindOneCategoryInput,
    @GetCurrentUserId() id: string,
  ) {
    return this.categoryService.findOne(findOneCategoryInput.id, id);
  }

  @Query(() => Category)
  adminFindOneCategory(
    @Args('findOneCategoryInput') findOneCategoryInput: FindOneCategoryInput,
    @GetCurrentUserId() id: string,
  ) {
    return this.categoryService.findOne(findOneCategoryInput.id, id, true);
  }

  @Mutation(() => Category)
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
    @Args('findOneCategoryInput') findOneCategoryInput: FindOneCategoryInput,
    @GetCurrentUserId() id: string,
  ) {
    return this.categoryService.update(
      updateCategoryInput,
      findOneCategoryInput.id,
      id,
    );
  }

  @Mutation(() => Category)
  removeCategory(
    @Args('findOneCategoryInput') findOneCategoryInput: FindOneCategoryInput,
    @GetCurrentUserId() id: string,
  ) {
    return this.categoryService.remove(findOneCategoryInput.id, id);
  }
}
