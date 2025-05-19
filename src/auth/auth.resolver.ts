import { Resolver, Mutation, Args } from '@nestjs/graphql';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterInput, LoginInput, AuthResponse } from './dto/auth.dto';

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('input') { username, password }: LoginInput,
  ): Promise<AuthResponse> {
    try {
      return await this.authService.signIn(username, password);
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during login',
      );
    }
  }

  @Public()
  @Mutation(() => AuthResponse)
  async register(
    @Args('input') { username, password }: RegisterInput,
  ): Promise<AuthResponse> {
    try {
      return await this.authService.register(username, password);
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred during registration',
      );
    }
  }
}
