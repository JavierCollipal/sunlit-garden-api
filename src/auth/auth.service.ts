import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserInput } from '../users/dto/create-user.input';
import { Types } from 'mongoose';
import {
  JwtPayload,
  ValidatedUser,
  AuthTokenResponse,
} from './types/auth.types';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates a user's credentials
   * @param username - The username to validate
   * @param password - The password to validate
   * @returns The validated user information or null if validation fails
   */
  async validateUser(
    username: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersService.findOne(username);
    // Return null if user not found or password doesn't match
    if (!user || !(await this.verifyUserPassword(user, password))) {
      return null;
    }
    return this.extractUserIdentity(user);
  }

  /**
   * Signs in a user and returns an access token
   * @param username - The username to sign in with
   * @param pass - The password to sign in with
   * @returns An object containing the access token
   */
  async signIn(username: string, pass: string): Promise<AuthTokenResponse> {
    const user = await this.usersService.findOne(username);
    // Throw an exception if user not found or password doesn't match
    if (!user || !(await this.verifyUserPassword(user, pass))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate and return the access token
    return this.generateAccessToken(user);
  }

  /**
   * Registers a new user and returns an access token
   * @param username - The username to register
   * @param password - The password to register
   * @returns An object containing the access token
   */
  async register(
    username: string,
    password: string,
  ): Promise<AuthTokenResponse> {
    try {
      const createUserInput: CreateUserInput = { username, password };
      // Create the user
      const user = await this.usersService.create(createUserInput);

      // Generate and return the access token
      return this.generateAccessToken(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // Throw unauthorized exception for other errors
      throw new UnauthorizedException('Registration failed');
    }
  }

  /**
   * Verifies a user's password
   * @param user - The user document
   * @param password - The password to verify
   * @returns Whether the password is valid
   */
  private async verifyUserPassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    return user.comparePassword(password);
  }

  /**
   * Extracts user identity information from a user document
   * @param user - The user document
   * @returns The user identity information
   */
  private extractUserIdentity(user: UserDocument): ValidatedUser {
    return {
      username: user.username,
      userId: (user._id as Types.ObjectId).toString(),
    };
  }

  /**
   * Generates a JWT payload from a user document
   * @param user - The user document
   * @returns The JWT payload
   */
  private createJwtPayload(user: UserDocument): JwtPayload {
    return {
      sub: (user._id as Types.ObjectId).toString(),
      username: user.username,
    };
  }

  /**
   * Generates an access token for a user
   * @param user - The user document
   * @returns An object containing the access token
   */
  private async generateAccessToken(
    user: UserDocument,
  ): Promise<AuthTokenResponse> {
    const payload = this.createJwtPayload(user);
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
