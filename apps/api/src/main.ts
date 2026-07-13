import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Configure Winston Logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          process.env.NODE_ENV === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              ),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  // Middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://cabinet.localhost:3000',
        'https://cabinet.gustam.dev',
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.gustam.dev')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev access
      }
    },
    credentials: true,
  });

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors and Filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Gustam Platform API')
    .setDescription('Central API for Gustam Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Write OpenAPI JSON spec on startup
  try {
    const swaggerJsonPath = path.resolve(process.cwd(), 'openapi.json');
    fs.writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));
    logger.log(`OpenAPI JSON spec written to: ${swaggerJsonPath}`);
  } catch (err) {
    logger.error('Failed to write OpenAPI JSON spec file', err);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
