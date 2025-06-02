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
    origin: [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:4000',
      'http://localhost:19006',
      'http://localhost:8001',
      'https://sunlit-garden-api-ec124189a937.herokuapp.com',
    ],
    credentials: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
    maxAge: 86400, // 24 hours in seconds
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
