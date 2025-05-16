/**
 * JWT payload structure used for token generation and validation
 */
export interface JwtPayload {
  sub: string;
  username: string;
}

/**
 * Validated user information returned after authentication
 */
export interface ValidatedUser {
  username: string;
  userId: string;
}

/**
 * Authentication token response structure
 */
export interface AuthTokenResponse {
  access_token: string;
}

/**
 * User context available in authenticated requests
 */
export interface UserContext {
  userId: string;
  username: string;
}
