import { Module } from '@nestjs/common';
import { CategoryGroupsController } from './category-groups.controller';
import { CategoriesService } from '../categories/categories.service';

@Module({
  controllers: [CategoryGroupsController],
  providers: [CategoriesService],
})
export class CategoryGroupsModule {}
