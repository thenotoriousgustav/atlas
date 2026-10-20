import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Header,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
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

  @Public()
  @Get('shared/:token')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  @ApiOperation({ summary: 'View a shared collection of bookmarks without signing in' })
  async findShared(@Param('token') token: string) {
    return this.foldersService.findShared(token);
  }

  @Post('shared/:token/copy')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Copy public bookmarks into a new private collection for the signed-in user' })
  async copyShared(@CurrentUser() user: any, @Param('token') token: string) {
    return this.foldersService.copyShared(user.id, token);
  }

  @Get(':id/share')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Get folder sharing status (owner only)' })
  async getShare(@CurrentUser() user: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.foldersService.getShare(user.id, id);
  }

  @Put(':id/share')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Enable a public collection link (owner only)' })
  async enableShare(@CurrentUser() user: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.foldersService.enableShare(user.id, id);
  }

  @Delete(':id/share')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({ summary: 'Revoke a public collection link (owner only)' })
  async disableShare(@CurrentUser() user: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.foldersService.disableShare(user.id, id);
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
