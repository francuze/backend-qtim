import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('должен быть определен', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('должен создать нового пользователя и захэшировать пароль', async () => {
      const registerDto = {
        username: 'test',
        password: 'password',
        email: 'test@example.com',
      };

      // Фиксированное значение для хэша пароля
      const hashedPassword = 'hashed-password';
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));

      const user = {
        ...registerDto,
        password: hashedPassword,
        id: 1,
      };

      // Мокаем методы репозитория
      jest.spyOn(userRepository, 'create').mockReturnValue(user as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user as any);

      const result = await authService.register(registerDto);

      // Проверяем вызовы методов
      expect(userRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);

      // Проверяем результат
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('должен возвращать токен доступа, если учетные данные действительны', async () => {
      const loginDto = {
        username: 'test',
        password: 'password',
      };

      const user = {
        id: 1,
        username: 'test',
        password: 'hashed-password',
      };

      const accessToken = 'token';
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);

      // Мокаем bcrypt.compare
      jest.spyOn(bcrypt, 'compare').mockImplementation((plainTextPassword: string, hashedPassword: string) => {
        return Promise.resolve(plainTextPassword === 'password' && hashedPassword === 'hashed-password');
      });

      // Мокаем jwtService.sign
      jest.spyOn(jwtService, 'sign').mockReturnValue(accessToken);

      const result = await authService.login(loginDto);

      // Проверяем вызовы методов
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.username,
        sub: user.id,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      // Проверяем результат
      expect(result).toEqual({ accessToken });
    });

    it('должен выбрасывать UnauthorizedException, если учетные данные неверны', async () => {
      const loginDto = {
        username: 'test',
        password: 'wrong-password',
      };

      const user = {
        id: 1,
        username: 'test',
        password: 'hashed-password',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);

      // Мокаем bcrypt.compare
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('должен выбрасывать UnauthorizedException, если пользователь не найден', async () => {
      const loginDto = {
        username: 'nonexistent',
        password: 'password',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
