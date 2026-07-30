import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateBudgetShareDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
