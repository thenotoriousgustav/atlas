import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';
import { BudgetShareGuard } from './budget-share.guard';

@ApiTags('category-groups')
@ApiBearerAuth()
@Controller('v1/category-groups')
@UseGuards(JwtAuthGuard, BudgetShareGuard)
export class CategoryGroupsController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category group' })
  async createGroup(
    @CurrentUser() user: any,
    @Body() dto: CreateCategoryGroupDto,
  ) {
    return this.categoriesService.createGroup(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all category groups with categories' })
  async findAllGroups(@CurrentUser() user: any) {
    return this.categoriesService.findAllGroups(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category group' })
  async updateGroup(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryGroupDto,
  ) {
    return this.categoriesService.updateGroup(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category group' })
  async removeGroup(@CurrentUser() user: any, @Param('id') id: string) {
    return this.categoriesService.removeGroup(user.id, id);
  }
}
