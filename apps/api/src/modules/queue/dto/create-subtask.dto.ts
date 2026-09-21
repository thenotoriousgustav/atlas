import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubtaskDto {
  @ApiProperty({ description: 'Subtask title', example: 'Review API requirements' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
