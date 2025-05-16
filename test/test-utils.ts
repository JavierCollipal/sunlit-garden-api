import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import mongoose from 'mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { NotesModule } from '../src/notes/notes.module';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import * as supertest from 'supertest';
import * as passport from 'passport';
import { GqlThrottlerGuard } from '../src/common/guards/gql-throttler.guard';
import { CreateUserInput } from '../src/users/dto/create-user.input';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { Request } from 'express';

// Define the expected shape of the login response body
interface LoginResponseBody {
  access_token: string;
}

let app: INestApplication;

export async function createTestingApp(): Promise<INestApplication> {
  try {
    // Close any existing connection
    await mongoose.disconnect();

    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    console.log('MongoDB URI:', mongoUri);
    console.log('JWT Secret:', jwtSecret ? 'Loaded' : 'Not Loaded');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          ttl: 1000, // 1 second for testing
          limit: 5, // 5 requests per second
        }]),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [
            () => (
              {
                JWT_SECRET: jwtSecret,
                MONGODB_URI: mongoUri,
                ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
              }
            ),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          context: ({ req }: { req: Request }) => {
            // Explicitly add Passport authentication to GraphQL context
            try {
              passport.initialize();
              passport.authenticate('jwt', { session: false });
            } catch (error: unknown) {
              console.error(
                'Passport initialization error:',
                error instanceof Error ? error.message : 'Unknown error',
              );
            }
            return { req };
          },
        }),
        NotesModule,
        AuthModule,
        UsersModule,
        PassportModule.register({ session: false }),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: GqlThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Add global validation pipe with transform enabled
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Explicitly initialize Passport
    app.use(passport.initialize());

    // Add more detailed error handling
    try {
      await app.init();
      console.log('Test application initialized successfully');
    } catch (initError: unknown) {
      console.error('Detailed Error initializing app:', initError);
      // Log stack trace for more context
      console.error(
        initError instanceof Error
          ? initError.stack
          : 'No stack trace available',
      );
      throw initError;
    }

    return app;
  } catch (error: unknown) {
    console.error('Critical Error creating test app:', error);
    // Log additional context and stack trace
    console.log('Environment Variables:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'DEFINED' : 'UNDEFINED',
      JWT_SECRET: process.env.JWT_SECRET ? 'LOADED' : 'UNDEFINED',
    });
    console.error(
      error instanceof Error ? error.stack : 'No stack trace available',
    );
    throw error;
  }
}

export async function closeTestingApp(): Promise<void> {
  try {
    const db = mongoose.connection?.db;
    if (db) {
      await db.dropDatabase();
    }
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    if (app) {
      await app.close();
    }
  } catch (error: unknown) {
    console.error('Error closing test app:', error);
  }
}

// Type-safe wrapper for supertest

export function request(app: unknown): ReturnType<typeof supertest> {
  return supertest(app as any);
}

export async function loginUserAndGetToken(
  appInstance: INestApplication,
  userInput: CreateUserInput,
): Promise<string> {
  try {
    // Register the user
    const registerResponse = await request(appInstance.getHttpServer())
      .post('/auth/register')
      .send(userInput);

    // If registration fails and it's not because the user already exists, throw an error
    if (registerResponse.status !== 201 && registerResponse.status !== 409) {
      console.error('Registration failed:', registerResponse.body);
      throw new Error(
        `Failed to register user ${userInput.username}. Status: ${registerResponse.status}, Body: ${JSON.stringify(registerResponse.body)}`,
      );
    }

    // Login the user
    const loginResponse = await request(appInstance.getHttpServer())
      .post('/auth/login')
      .send(userInput);

    // Use the defined interface for type safety
    const responseBody = loginResponse.body as LoginResponseBody;

    if (loginResponse.status !== 200 || !responseBody.access_token) {
      console.error('Login failed:', loginResponse.body);
      throw new Error(
        `Failed to login user ${userInput.username}. Status: ${loginResponse.status}, Body: ${JSON.stringify(responseBody)}`,
      );
    }

    return responseBody.access_token;
  } catch (error: unknown) {
    console.error('Login process error:', error);
    throw error;
  }
}
