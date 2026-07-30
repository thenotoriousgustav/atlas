import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FuelModule } from './fuel/fuel.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RemindersModule } from './reminders/reminders.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    PrismaModule,
    VehiclesModule,
    MaintenanceModule,
    FuelModule,
    ExpensesModule,
    RemindersModule,
    DocumentsModule,
  ],
  exports: [
    VehiclesModule,
    MaintenanceModule,
    FuelModule,
    ExpensesModule,
    RemindersModule,
    DocumentsModule,
  ],
})
export class GarageModule {}
