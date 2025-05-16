import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ValidatedUser } from '../types/auth.types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'username', passwordField: 'password' });
  }

  /**
   * Validates user credentials for local authentication
   * @param username - The username to validate
   * @param password - The password to validate
   * @returns The validated user information
   */
  async validate(username: string, password: string): Promise<ValidatedUser> {
    // Attempt to validate the user with the auth service
    const user = await this.authService.validateUser(username, password);
    // Throw an exception if validation fails
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return the validated user information
    return user;
  }
}
