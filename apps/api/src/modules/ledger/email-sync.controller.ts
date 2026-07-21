import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetShareGuard } from './budget-share.guard';
import { EmailSyncService } from './email-sync.service';
import { UpdateEmailSyncConfigDto, SimulateEmailDto, SyncEmailsBodyDto } from './dto/update-email-sync.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('email-sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BudgetShareGuard)
@Controller('v1/email-sync')
export class EmailSyncController {
  constructor(private readonly emailSyncService: EmailSyncService) {}

  @ApiOperation({ summary: 'Get current email sync configuration' })
  @Get('config')
  getConfig(@Request() req) {
    return this.emailSyncService.getConfig(req.user.id);
  }

  @ApiOperation({ summary: 'Save email sync configuration' })
  @Post('config')
  saveConfig(@Request() req, @Body() dto: UpdateEmailSyncConfigDto) {
    return this.emailSyncService.saveConfig(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Sync transactions from email (real IMAP fetch or simulated templates)' })
  @Post('sync')
  syncEmails(@Request() req, @Body() body: SyncEmailsBodyDto) {
    if (body?.emails && body.emails.length > 0) {
      return this.emailSyncService.syncSimulatedEmails(req.user.id, body.emails);
    }
    return this.emailSyncService.syncRealIMAPEmails(req.user.id);
  }

  @ApiOperation({ summary: 'Test IMAP connection' })
  @Post('test')
  testConnection(@Request() req) {
    return this.emailSyncService.testConnection(req.user.id);
  }
}
