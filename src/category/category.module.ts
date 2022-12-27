import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResolver } from './category.resolver';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [CategoryResolver, CategoryService],
})
export class CategoryModule {}
