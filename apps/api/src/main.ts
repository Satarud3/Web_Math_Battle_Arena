import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Look for .env in current, parent, or grandparent directories to support monorepo paths
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
  path.join(__dirname, '..', '..', '..', '.env'),
  path.join(__dirname, '..', '..', '..', '..', '.env'),
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Register cookie parser middleware
  app.use(cookieParser());

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // Strips non-validated fields
    transform: true,       // Transforms payloads to typed DTOs
  }));

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // Port frontend Next.js
    credentials: true,               // Wajib true agar cookie HttpOnly bisa lewat
  });

  const port = process.env.BACKEND_PORT || process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[NestJS] Application is running on: http://localhost:${port}`);
}
bootstrap();
