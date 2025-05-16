import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { Types } from 'mongoose';
import { JwtPayload, UserContext } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validates the JWT payload and returns user context
   * @param payload - The JWT payload
   * @returns The user context for the request
   */
  async validate(payload: JwtPayload): Promise<UserContext> {
    try {
      // Find the user by username from the payload
      const user = await this.findUserFromPayload(payload);
      // Validate the user exists
      this.validateUserExists(user, payload.username);
      // Validate the user ID - at this point user is not null (validated above)
      const userId = this.validateAndExtractUserId(user!, payload.username);
      // Return user context for the request
      return this.createUserContext(userId, user!.username);
    } catch (error) {
      // Log and rethrow authentication errors
      this.handleValidationError(error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Finds a user from the JWT payload
   * @param payload - The JWT payload
   * @returns The user document or null
   */
  private async findUserFromPayload(
    payload: JwtPayload,
  ): Promise<UserDocument | null> {
    return (await this.usersService.findOne(
      payload.username,
    )) as UserDocument | null;
  }

  /**
   * Validates that the user exists
   * @param user - The user document
   * @param username - The username
   */
  private validateUserExists(
    user: UserDocument | null,
    username: string,
  ): void {
    if (!user) {
      console.warn(`JWT validation failed: User not found - ${username}`);
      throw new UnauthorizedException('User not found');
    }
  }

  /**
   * Validates and extracts the user ID
   * @param user - The user document
   * @param username - The username
   * @returns The user ID as a string
   */
  private validateAndExtractUserId(
    user: UserDocument,
    username: string,
  ): string {
    const userId = user._id;
    if (!userId) {
      console.error(`JWT validation failed: Invalid user ID for ${username}`);
      throw new UnauthorizedException('Invalid user');
    }
    return (userId as Types.ObjectId).toString();
  }

  /**
   * Creates a user context object
   * @param userId - The user ID
   * @param username - The username
   * @returns The user context
   */
  private createUserContext(userId: string, username: string): UserContext {
    return {
      userId,
      username,
    };
  }

  /**
   * Handles validation errors
   * @param error - The error
   */
  private handleValidationError(error: unknown): void {
    console.error(
      `JWT validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
