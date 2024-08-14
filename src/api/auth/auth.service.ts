import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    // Хэшируем пароль с использованием bcrypt-ts
    const hashedPassword = await this.hashPassword(registerDto.password);
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    // Находим пользователя по имени
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    // Проверяем пароль
    if (!user || !(await this.verifyPassword(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Создаем JWT токен
    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  private async hashPassword(password: string): Promise<string> {
    // Хэшируем пароль с использованием bcrypt-ts
    const saltRounds = 10; // Количество раундов для генерации соли
    return await bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // Проверяем пароль с использованием bcrypt-ts
    return await bcrypt.compare(password, hashedPassword);
  }
}
