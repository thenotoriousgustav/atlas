import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { PrismaModule } from "./prisma/prisma.module"
import { AuthModule } from "./auth/auth.module"
import { UserModule } from "./user/user.module"
import { CabinetModule } from "./modules/cabinet/cabinet.module"
import { HealthController } from "./health/health.controller"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env', '../apps/api/.env'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CabinetModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
