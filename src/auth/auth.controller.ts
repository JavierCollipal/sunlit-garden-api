import {
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
  signIn(@Body() signInDto: SignInDto): Promise<{ access_token: string }> {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Public()
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ access_token: string }> {
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
