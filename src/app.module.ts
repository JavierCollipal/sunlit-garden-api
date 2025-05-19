import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotesModule } from './notes/notes.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PassportModule } from '@nestjs/passport';
import { Request } from 'express';
import { GraphQLError } from 'graphql';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

interface OriginalErrorWithStatus {
  status?: number;
  message?: string;
}

type ErrorWithExtensions = GraphQLError & {
  extensions?: {
    originalError?: OriginalErrorWithStatus | null;
  };
};

function isOriginalErrorWithStatus(
  error: unknown,
): error is OriginalErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as OriginalErrorWithStatus).status === 'number'
  );
}

function formatGraphQLError(
  error: ErrorWithExtensions,
):
  | ErrorWithExtensions
  | { message: string; statusCode: number; details?: unknown } {
  console.error('GraphQL Error:', {
    message: error.message,
    path: error.path,
    extensions: error.extensions,
    originalError: error.extensions?.originalError,
  });

  const originalError = error.extensions?.originalError ?? null;

  if (originalError !== null && isOriginalErrorWithStatus(originalError)) {
    if (originalError.status === 401) {
      return {
        message: 'Unauthorized',
        statusCode: 401,
        details: originalError.message,
      };
    }
  }

  // Return detailed error info for debugging
  return {
    message: error.message,
    statusCode: 500,
    details: {
      path: error.path,
      extensions: error.extensions,
    },
  };
}

@Module({
  imports: [
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: process.env.NODE_ENV === 'production' ? 50 : 100,
      },
    ]),
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>): Record<string, unknown> => {
        const requiredVars = [
          'MONGODB_URI',
          'JWT_SECRET',
          'JWT_EXPIRATION_TIME',
          'NODE_ENV',
          'ALLOWED_ORIGINS',
        ];
        for (const var_ of requiredVars) {
          if (!config[var_]) {
            throw new Error(`Missing required environment variable: ${var_}`);
          }
        }
        return config;
      },
    }),
    // Database configuration
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
          throw new Error('MONGODB_URI environment variable is not defined');
        }
        return {
          uri,
          // Production MongoDB settings
          ...(process.env.NODE_ENV === 'production' && {
            retryWrites: true,
            w: 'majority',
            ssl: true,
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000,
          }),
        };
      },
    }),
    // GraphQL configuration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: Request }): { req: Request } => {
        if (!req) {
          throw new Error('Request object not found in GraphQL context');
        }
        return { req };
      },
      formatError: formatGraphQLError,
      // Enable debugging features
      debug: true,
      playground: true,
      introspection: true,
    }),
    TerminusModule,
    NotesModule,
    AuthModule,
    UsersModule,
    PassportModule.register({ session: false }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
