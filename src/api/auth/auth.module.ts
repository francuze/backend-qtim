import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        // Импорт TypeORM для работы с сущностями
        TypeOrmModule.forFeature([User]),

        // Импорт JwtModule для работы с JWT
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' }, // Время жизни токена
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UserService,JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
