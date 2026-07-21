import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailSyncConfigDto {
  @ApiProperty({ example: 'imap.gmail.com' })
  @IsString()
  imapHost: string;

  @ApiProperty({ example: 993 })
  @IsInt()
  imapPort: number;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'your-app-password' })
  @IsString()
  password: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

export class SimulateEmailDto {
  @ApiProperty({ example: 'Bank Jago: Uang keluar Rp 75.000 ke Kopi Kenangan' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Hai Gustam, transaksi Uang keluar sebesar Rp 75.000 ke Kopi Kenangan berhasil didebet dari kantong utama Anda pada 2026-07-20.' })
  @IsString()
  body: string;
}

export class SyncEmailsBodyDto {
  @ApiProperty({ type: [SimulateEmailDto], required: false })
  @IsOptional()
  emails?: SimulateEmailDto[];
}
