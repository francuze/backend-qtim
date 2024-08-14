import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserService } from './user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService, // Внедряем UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Валидация JWT payload и получение информации о пользователе
    const user = await this.userService.findOneById(payload.sub); // Используем UserService для поиска пользователя

    // Проверяем, что пользователь существует
    if (!user) {
      throw new Error('User not found'); // Или выбрасываем исключение, если пользователь не найден
    }

    return { userId: user.id, username: user.username }; // Возвращаем информацию о пользователе
  }
}
