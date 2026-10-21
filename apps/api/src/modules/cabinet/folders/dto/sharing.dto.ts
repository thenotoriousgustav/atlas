import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FolderRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';

export class InvitationDto {
  @ApiPropertyOptional({ enum: FolderRole, description: 'Role granted to people who join with the link' })
  @IsEnum(FolderRole)
  @IsOptional()
  role?: FolderRole;
}

export class MemberRoleDto {
  @ApiProperty({ enum: FolderRole })
  @IsEnum(FolderRole)
  role!: FolderRole;
}

export class AddMemberDto extends MemberRoleDto {
  @ApiProperty({ example: 'friend@example.com', description: 'Email of an existing Cabinet account' })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
