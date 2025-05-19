import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  username: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  username: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;
}

// Keep existing types for REST endpoints until fully migrated
export interface JwtRequest {
  user: {
    sub: string;
    username: string;
  };
}

export type SignInDto = LoginInput;
export type RegisterDto = RegisterInput;
