import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RegisterInput, LoginInput, AuthResponse } from './dto/auth.dto';
import {
  AuthResult,
  Username,
  Password,
  asUsername,
  asPassword,
} from './types/types';

type AuthMutationHandler = (
  username: Username,
  password: Password,
) => Promise<AuthResult>;

@Resolver('Auth')
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  private handleAuthOperation = async (
    operation: AuthMutationHandler,
    input: LoginInput | RegisterInput,
    operationType: string,
  ): Promise<AuthResponse> => {
    try {
      return await operation(
        asUsername(input.username),
        asPassword(input.password),
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(error.message);
      }
      throw new UnauthorizedException(
        `An unexpected error occurred during ${operationType}`,
      );
    }
  };

  @Public()
  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.handleAuthOperation(
      this.authService.signIn.bind(this.authService),
      input,
      'login',
    );
  }

  @Public()
  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.handleAuthOperation(
      this.authService.register.bind(this.authService),
      input,
      'registration',
    );
  }
}
