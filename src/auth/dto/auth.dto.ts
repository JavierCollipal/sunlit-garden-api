export class SignInDto {
  username: string;
  password: string;
}

export class RegisterDto {
  username: string;
  password: string;
}

export interface JwtRequest extends Request {
  user: {
    sub: string;
    username: string;
  };
}
