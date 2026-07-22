/**
 * Generated for Gustam Platform API
 */

export interface CreateGoalDto {
  name: string;
  type: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution?: number;
  targetDate?: string;
  icon?: string;
  color?: string;
}
