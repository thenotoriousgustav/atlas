import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('v1/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new vehicle document' })
  async create(@CurrentUser() user: any, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(user.id, createDocumentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get logged vehicle documents' })
  @ApiQuery({ name: 'vehicleId', required: false })
  async findAll(@CurrentUser() user: any, @Query('vehicleId') vehicleId?: string) {
    return this.documentsService.findAll(user.id, vehicleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a document log record' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.remove(user.id, id);
  }
}
