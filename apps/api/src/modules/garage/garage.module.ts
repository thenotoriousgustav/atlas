import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { FuelController } from './fuel.controller';
import { FuelService } from './fuel.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    VehiclesController,
    MaintenanceController,
    FuelController,
    ExpensesController,
    RemindersController,
    DocumentsController,
  ],
  providers: [
    VehiclesService,
    MaintenanceService,
    FuelService,
    ExpensesService,
    RemindersService,
    DocumentsService,
  ],
  exports: [
    VehiclesService,
    MaintenanceService,
    FuelService,
    ExpensesService,
    RemindersService,
    DocumentsService,
  ],
})
export class GarageModule {}
