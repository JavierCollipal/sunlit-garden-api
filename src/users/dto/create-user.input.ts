import { IsString, MinLength } from 'class-validator';

export class CreateUserInput {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6) // Enforce a minimum password length
  password: string;
}
