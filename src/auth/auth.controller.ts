import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRequest, RegisterDto, SignInDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    if (!signInDto.username || !signInDto.password) {
      throw new BadRequestException({
        message: 'Username and password are required',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    if (signInDto.password.length < 6) {
      throw new BadRequestException({
        message: 'Password is too short',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ access_token: string }> {
    if (!registerDto.username || !registerDto.password) {
      throw new BadRequestException({
        message: 'Username and password are required',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    if (registerDto.password.length < 6) {
      throw new BadRequestException({
        message: 'Password is too short',
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    return this.authService.register(
      registerDto.username,
      registerDto.password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: JwtRequest) {
    return {
      userId: req.user.sub,
      username: req.user.username,
    };
  }
}
