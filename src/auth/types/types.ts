import { Types } from 'mongoose';
import { UserDocument } from '../../users/schemas/user.schema';

// Base types
export type Username = string & { readonly __tag: unique symbol };
export type Password = string & { readonly __tag: unique symbol };
export type UserId = string & { readonly __tag: unique symbol };
export type AccessToken = string & { readonly __tag: unique symbol };

// Request types
export type AuthRequest = {
  readonly username: Username;
  readonly password: Password;
};

// Domain types
export type ValidatedUser = {
  username: string;
  userId: string;
};

export type UserIdentity = {
  readonly username: Username;
  readonly userId: UserId;
};

export type TokenPayload = {
  readonly sub: UserId;
  readonly username: Username;
};

export type AuthResult = {
  readonly access_token: AccessToken;
};

// Error types
export type AuthError =
  | { type: 'INVALID_CREDENTIALS'; message: string }
  | { type: 'REGISTRATION_FAILED'; message: string }
  | { type: 'UNEXPECTED_ERROR'; message: string };

// Type guards
export const isUserDocument = (value: unknown): value is UserDocument => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'comparePassword' in value &&
      typeof (value as UserDocument).comparePassword === 'function',
  );
};

export const isValidMongoId = (value: any): value is Types.ObjectId => {
  return Types.ObjectId.isValid(value);
};

// Type assertions
export const asUsername = (value: string): Username => value as Username;
export const asPassword = (value: string): Password => value as Password;
export const asUserId = (value: string): UserId => value as UserId;
export const asAccessToken = (value: string): AccessToken => value as AccessToken;

// Result type for error handling
export type Result<T, E = AuthError> =
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});
export const failure = (error: AuthError): Result<never> => ({
  success: false,
  error,
});
