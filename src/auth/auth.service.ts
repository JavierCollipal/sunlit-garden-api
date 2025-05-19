import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserInput } from '../users/dto/create-user.input';
import {
  AuthResult,
  asUsername,
  asPassword,
  ValidatedUser,
  Result,
} from './types/types';
import {
  AuthOperations,
  createAuthOperations,
  extractUserIdentity,
  handleAuthError,
  validateUserCredentials,
} from './utils/utils';

@Injectable()
export class AuthService {
  private readonly authOperations: AuthOperations;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    this.authOperations = createAuthOperations(jwtService);
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersService.findOne(username);
    if (!user) return null;

    const validationResult = await validateUserCredentials(user, password);
    return validationResult.success ? extractUserIdentity(user) : null;
  }

  async signIn(username: string, password: string): Promise<AuthResult> {
    const safeUsername = asUsername(username);
    const safePassword = asPassword(password);
    const user = await this.usersService.findOne(safeUsername);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const result = await this.authOperations.validateAndGenerateToken(
      user,
      safePassword,
    );
    return this.handleAuthResult(result);
  }

  async register(username: string, password: string): Promise<AuthResult> {
    const createUserInput: CreateUserInput = {
      username: asUsername(username),
      password: asPassword(password),
    };

    try {
      const user = await this.usersService.create(createUserInput);
      const result = await this.authOperations.createRegistrationToken(user);
      return this.handleAuthResult(result);
    } catch (e) {
      const result = handleAuthError(e);
      if (!result.success) {
        throw new UnauthorizedException(result.error.message);
      }
      throw new UnauthorizedException('Registration failed');
    }
  }

  private handleAuthResult(result: Result<AuthResult>): AuthResult {
    if (!result.success) {
      throw new UnauthorizedException(result.error.message);
    }
    return result.data;
  }
}
