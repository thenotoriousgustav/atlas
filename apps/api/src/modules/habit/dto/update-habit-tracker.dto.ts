import { PartialType } from '@nestjs/swagger';
import { CreateHabitTrackerDto } from './create-habit-tracker.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHabitTrackerDto extends PartialType(CreateHabitTrackerDto) {
  @IsBoolean()
  @IsOptional()
  archived?: boolean;
}
