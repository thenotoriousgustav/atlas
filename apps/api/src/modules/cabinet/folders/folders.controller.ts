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
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@ApiTags('folders')
@ApiCookieAuth()
@Controller('v1/folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  async create(
    @CurrentUser() user: any,
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return this.foldersService.create(user.id, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active folders' })
  async findAll(@CurrentUser() user: any) {
    return this.foldersService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.foldersService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a folder by ID' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.foldersService.update(user.id, id, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a folder and all its contents recursively' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.foldersService.remove(user.id, id);
  }
}
