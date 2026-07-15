import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('v1/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  async create(
    @CurrentUser() user: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.id, createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get subscriptions with optional filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'PAUSED', 'CANCELLED'] })
  @ApiQuery({ name: 'billingCycle', required: false, enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('status') status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED',
    @Query('billingCycle') billingCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    @Query('search') search?: string,
  ) {
    return this.subscriptionsService.findAll(user.id, { status, billingCycle, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subscriptionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription by ID' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(user.id, id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a subscription by ID' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subscriptionsService.remove(user.id, id);
  }
}
