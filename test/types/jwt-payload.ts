export interface JwtPayload {
  sub: string; // User ID
  username: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}
