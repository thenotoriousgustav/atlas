import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

// ponytail: CLI script to generate openapi.json without running the app server
async function generateSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });
  
  const config = new DocumentBuilder()
    .setTitle('Cabinet API')
    .setDescription('API for Cabinet bookmarks, notes, and saved reading')
    .setVersion('1.0')
    .addCookieAuth('cabinet.session_token')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  const swaggerJsonPath = path.resolve(process.cwd(), 'openapi.json');
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));
  console.log('OpenAPI JSON spec written successfully.');
  
  await app.close();
  process.exit(0);
}

generateSpec().catch((err) => {
  console.error('Failed to generate spec:', err);
  process.exit(1);
});
