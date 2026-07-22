/**
 * Generated for Gustam Platform API
 */

export interface Goal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string | null;
  icon?: string | null;
  color?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
