import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy'; // We'll create this next

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here too
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in the configuration');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION_TIME', '60m'),
          }, // Default to 60 minutes
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, AuthResolver], // Add AuthResolver
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if needed elsewhere
})
export class AuthModule {}
