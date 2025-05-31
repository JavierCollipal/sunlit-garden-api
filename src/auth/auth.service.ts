import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LoggerService } from '../common/services/logger.service';
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

interface NestError {
  status?: number;
  response?: {
    statusCode?: number;
    message?: string;
  };
}

interface AuthErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

@Injectable()
export class AuthService {
  private readonly authOperations: AuthOperations;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    this.authOperations = createAuthOperations(jwtService);
    this.logger = new LoggerService('AuthService');
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<ValidatedUser | null> {
    this.logger.logOperation('validateUser', { username });

    const user = await this.usersService.findOne(username);
    if (!user) {
      this.logger.logOperation(
        'validateUser',
        { username },
        new Error('User not found'),
      );
      return null;
    }

    const validationResult = await validateUserCredentials(user, password);
    if (!validationResult.success) {
      this.logger.logOperation(
        'validateUser',
        { username },
        new Error('Invalid credentials'),
      );
      return null;
    }

    this.logger.logOperation('validateUser', { username, success: true });
    return extractUserIdentity(user);
  }

  async signIn(username: string, password: string): Promise<AuthResult> {
    const safeUsername = asUsername(username);
    const safePassword = asPassword(password);

    this.logger.logOperation('signIn', { username: safeUsername });
    const user = await this.usersService.findOne(safeUsername);

    if (!user) {
      const response: AuthErrorResponse = {
        message: 'Invalid credentials',
        error: 'Unauthorized',
        statusCode: 401,
      };
      this.logger.logOperation(
        'signIn',
        { username: safeUsername },
        new UnauthorizedException(response),
      );
      throw new UnauthorizedException(response);
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

    this.logger.logOperation('register', {
      username: createUserInput.username,
    });

    try {
      const user = await this.usersService.create(createUserInput);
      const result = await this.authOperations.createRegistrationToken(user);
      return this.handleAuthResult(result);
    } catch (error: unknown) {
      const nestError = error as NestError;

      if (nestError.status === 409 || nestError.response?.statusCode === 409) {
        const response: AuthErrorResponse = {
          message: 'Username already exists',
          error: 'Conflict',
          statusCode: 409,
        };
        this.logger.logOperation(
          'register',
          { username: createUserInput.username },
          new ConflictException(response),
        );
        throw new ConflictException(response);
      }

      const result = handleAuthError(error);
      if (!result.success) {
        const response: AuthErrorResponse = {
          message: result.error.message,
          error: 'Bad Request',
          statusCode: 400,
        };
        throw new BadRequestException(response);
      }

      const response: AuthErrorResponse = {
        message: 'Registration failed',
        error: 'Bad Request',
        statusCode: 400,
      };
      throw new BadRequestException(response);
    }
  }

  private handleAuthResult(result: Result<AuthResult>): AuthResult {
    if (!result.success) {
      const response: AuthErrorResponse = {
        message: 'Invalid credentials',
        error: 'Unauthorized',
        statusCode: 401,
      };
      this.logger.logOperation(
        'handleAuthResult',
        { success: false },
        new UnauthorizedException(response),
      );
      throw new UnauthorizedException(response);
    }
    this.logger.logOperation('handleAuthResult', { success: true });
    return result.data;
  }
}
