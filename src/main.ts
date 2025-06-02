import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Explicitly initialize Passport
  app.use(passport.initialize());

  // Enable CORS with credentials
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Origin',
    ],
    exposedHeaders: ['Access-Control-Allow-Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add logging for debugging
  console.log(
    'Initializing NestJS application with Passport and Rate Limiting',
  );

  process.on('uncaughtException', (error: Error) => {
    if (error.message.includes('ThrottlerException')) {
      console.warn(`Rate limit exceeded: ${error.message}`);
    }
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
