import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({
    description: 'Данные для регистрации пользователя',
    type: RegisterDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован.',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные для регистрации.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход пользователя' })
  @ApiBody({
    description: 'Данные для входа пользователя',
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает JWT токен доступа.',
    schema: {
      example: {
        accessToken: 'токен_доступа_пользователя',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные для входа.',
  })
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }
}
