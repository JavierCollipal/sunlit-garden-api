import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { UserDocument } from '../../users/schemas/user.schema';
import {
  UserIdentity,
  TokenPayload,
  AuthResult,
  Result,
  success,
  failure,
  asUserId,
  asUsername,
  asAccessToken,
  isUserDocument,
} from '../types/types';

// Pure functions for user validation
export const validateUserCredentials = async (
  user: UserDocument | null,
  password: string,
): Promise<Result<UserDocument>> => {
  if (!isUserDocument(user)) {
    return failure({
      type: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password',
    });
  }

  const isValidPassword = await user.comparePassword(password);
  return isValidPassword
    ? success(user)
    : failure({
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
      });
};

// Pure function to extract user identity
export const extractUserIdentity = (user: UserDocument): UserIdentity => ({
  username: asUsername(user.username),
  userId: asUserId((user._id as Types.ObjectId).toString()),
});

// Pure function to create JWT payload
export const createTokenPayload = (user: UserDocument): TokenPayload => ({
  sub: asUserId((user._id as Types.ObjectId).toString()),
  username: asUsername(user.username),
});

// Pure function to generate access token
export const generateAuthToken = async (
  jwtService: JwtService,
  payload: TokenPayload,
): Promise<AuthResult> => ({
  access_token: asAccessToken(await jwtService.signAsync(payload)),
});

// Function composition helpers
export const pipe =
  <T>(...fns: Array<(arg: T) => T | Promise<T>>) =>
  async (value: T): Promise<T> =>
    fns.reduce(
      async (promise, fn) => fn(await promise),
      Promise.resolve(value),
    );

export const composeResults = <T, U>(
  fn1: (input: T) => Promise<Result<U>>,
  fn2: (input: U) => Promise<Result<U>>,
): ((input: T) => Promise<Result<U>>) => {
  return async (input: T): Promise<Result<U>> => {
    const result1 = await fn1(input);
    if (!result1.success) return result1;
    return fn2(result1.data);
  };
};

// Error handling helper
export const handleAuthError = (error: unknown): Result<never> => {
  if (error instanceof Error) {
    return failure({
      type: 'UNEXPECTED_ERROR',
      message: error.message,
    });
  }
  return failure({
    type: 'UNEXPECTED_ERROR',
    message: 'An unexpected error occurred',
  });
};

// Helper to ensure immutable auth operations
export type AuthOperations = {
  validateAndGenerateToken: (
    user: UserDocument | null,
    password: string,
  ) => Promise<Result<AuthResult>>;
  createRegistrationToken: (user: UserDocument) => Promise<Result<AuthResult>>;
};

export const createAuthOperations = (jwtService: JwtService): AuthOperations => ({
  validateAndGenerateToken: async (
    user: UserDocument,
    password: string,
  ): Promise<Result<AuthResult>> => {
    const validationResult = await validateUserCredentials(user, password);
    if (!validationResult.success) return validationResult;

    const payload = createTokenPayload(validationResult.data);
    const token = await generateAuthToken(jwtService, payload);
    return success(token);
  },

  createRegistrationToken: async (
    user: UserDocument,
  ): Promise<Result<AuthResult>> => {
    try {
      const payload = createTokenPayload(user);
      const token = await generateAuthToken(jwtService, payload);
      return success(token);
    } catch (error) {
      return handleAuthError(error);
    }
  },
});
