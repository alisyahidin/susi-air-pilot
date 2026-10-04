import { Body, Controller, HttpCode, HttpStatus, Post, SerializeOptions } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { AuthService } from './auth.service.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';
import { loginResponseSchema, type LoginResponseDto } from './dto/login-response.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ schema: loginResponseSchema })
  login(@Body({ schema: loginSchema }) body: LoginDto): Promise<LoginResponseDto> {
    return this.auth.login(body);
  }
}
