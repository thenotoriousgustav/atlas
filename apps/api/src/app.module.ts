import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CabinetModule } from './modules/cabinet/cabinet.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { GarageModule } from './modules/garage/garage.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CabinetModule,
    LedgerModule,
    GarageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
