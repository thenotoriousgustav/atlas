import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { UpdateCategoryGroupDto } from './dto/update-category-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private seedingPromises = new Map<string, Promise<void>>();

  // ponytail: Auto-seed defaults if user has no categories
  private readonly defaultSeed = [
    {
      name: 'Daily Needs',
      categories: ['Food & Drinks', 'Transportation', 'Gasoline', 'Household Needs'],
    },
    {
      name: 'Monthly Bills',
      categories: ['Electricity', 'Internet', 'Water', 'Rent / Mortgage', 'Mobile Data & Airtime'],
    },
    {
      name: 'Wants',
      categories: ['Entertainment', 'Shopping', 'Dining Out & Socializing', 'Travel & Vacation'],
    },
    {
      name: 'Subscriptions',
      categories: ['Streaming Services', 'Software & Apps', 'Gym & Fitness'],
    },
    {
      name: 'Savings & Investments',
      categories: ['Emergency Fund', 'Investments', 'Gifts & Donations'],
    },
  ];

  async ensureDefaultCategories(userId: string) {
    const existing = this.seedingPromises.get(userId);
    if (existing) {
      await existing;
      return;
    }

    let resolveSeeding: () => void;
    const promise = new Promise<void>((resolve) => {
      resolveSeeding = resolve;
    });
    this.seedingPromises.set(userId, promise);

    try {
      const count = await this.prisma.categoryGroup.count({
        where: { userId, deletedAt: null },
      });

      if (count === 0) {
        // Seeding
        for (let i = 0; i < this.defaultSeed.length; i++) {
          const group = this.defaultSeed[i];
          const createdGroup = await this.prisma.categoryGroup.create({
            data: {
              name: group.name,
              sortOrder: i,
              userId,
            },
          });

          for (let j = 0; j < group.categories.length; j++) {
            await this.prisma.category.create({
              data: {
                name: group.categories[j],
                categoryGroupId: createdGroup.id,
                sortOrder: j,
                userId,
              },
            });
          }
        }
      }
    } finally {
      this.seedingPromises.delete(userId);
      resolveSeeding!();
    }
  }

  // --- Category Groups CRUD ---

  async createGroup(userId: string, dto: CreateCategoryGroupDto) {
    return this.prisma.categoryGroup.create({
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        userId,
      },
    });
  }

  async findAllGroups(userId: string) {
    await this.ensureDefaultCategories(userId);

    return this.prisma.categoryGroup.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        categories: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async updateGroup(userId: string, id: string, dto: UpdateCategoryGroupDto) {
    // Check ownership
    const group = await this.prisma.categoryGroup.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException(`Category group not found`);

    return this.prisma.categoryGroup.update({
      where: { id },
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder,
        isHidden: dto.isHidden,
      },
    });
  }

  async removeGroup(userId: string, id: string) {
    const group = await this.prisma.categoryGroup.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException(`Category group not found`);

    // Soft delete group & its categories
    await this.prisma.category.updateMany({
      where: { categoryGroupId: id, userId },
      data: { deletedAt: new Date() },
    });

    return this.prisma.categoryGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- Categories CRUD ---

  async createCategory(userId: string, dto: CreateCategoryDto) {
    // Check group ownership
    const group = await this.prisma.categoryGroup.findFirst({
      where: { id: dto.categoryGroupId, userId, deletedAt: null },
    });
    if (!group) throw new NotFoundException(`Category group not found`);

    return this.prisma.category.create({
      data: {
        name: dto.name,
        categoryGroupId: dto.categoryGroupId,
        sortOrder: dto.sortOrder ?? 0,
        targetAmount: dto.targetAmount,
        targetType: dto.targetType,
        targetMonth: dto.targetMonth,
        targetYear: dto.targetYear,
        userId,
      },
    });
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!category) throw new NotFoundException(`Category not found`);

    if (dto.categoryGroupId) {
      const group = await this.prisma.categoryGroup.findFirst({
        where: { id: dto.categoryGroupId, userId, deletedAt: null },
      });
      if (!group) throw new NotFoundException(`Category group not found`);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        categoryGroupId: dto.categoryGroupId,
        sortOrder: dto.sortOrder,
        isHidden: dto.isHidden,
        targetAmount: dto.targetAmount,
        targetType: dto.targetType,
        targetMonth: dto.targetMonth,
        targetYear: dto.targetYear,
      },
    });
  }

  async removeCategory(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!category) throw new NotFoundException(`Category not found`);

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
