import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config'; // Импорт ConfigService

const mockUserService = () => ({
    findOneById: jest.fn(),
});

const mockConfigService = () => ({
  // Здесь можно добавить любые методы, которые использует JwtStrategy
  get: jest.fn().mockReturnValue('some-secret'),
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: UserService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: JwtService, useValue: {} }, // Мокаем JwtService, если это нужно
        { provide: UserService, useValue: mockUserService() },
        { provide: ConfigService, useValue: mockConfigService() }, // Мокаем ConfigService
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user if payload is valid', async () => {
      const payload = { username: 'test', sub: 1 };
      const user = { id: 1, username: 'test' };

      jest.spyOn(userService, 'findOneById').mockResolvedValue(user as any);

      const result = await strategy.validate(payload);
      expect(result).toEqual({ userId: user.id, username: user.username });
    });
  });
});
