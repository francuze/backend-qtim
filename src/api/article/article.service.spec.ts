import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { Redis } from 'ioredis';
import { User } from '../auth/entities/user.entity';

// Мокаем репозитории и Redis
const mockArticleRepository = () => ({
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
    preload: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({
      id: 1,
      ...dto,
      publishedDate: dto.publishedDate || new Date(), // Убедитесь, что поле `publishedDate` всегда присутствует
    }) as Article), // Явно указываем, что объект должен быть типом `Article`
  });
  
  

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

const mockRedisClient = {
  get: jest.fn().mockResolvedValue(null), // По умолчанию возвращаем null для get
  set: jest.fn().mockResolvedValue('OK'), // По умолчанию возвращаем 'OK' для set
  del: jest.fn().mockResolvedValue(1), // Возвращаем 1 для del
  keys: jest.fn().mockResolvedValue([]), // Возвращаем пустой массив для keys
};

describe('ArticleService', () => {
  let service: ArticleService;
  let articleRepository: Repository<Article>;
  let userRepository: Repository<User>;
  let redisClient: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: getRepositoryToken(Article), useValue: mockArticleRepository() },
        { provide: getRepositoryToken(User), useValue: mockUserRepository() },
        { provide: 'REDIS_CLIENT', useValue: mockRedisClient },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    articleRepository = module.get<Repository<Article>>(getRepositoryToken(Article));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    redisClient = module.get<Redis>('REDIS_CLIENT');
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });
  
  describe('create', () => {
    it('должен создать и вернуть статью', async () => {
      const createArticleDto = { title: 'Test Title', description: 'Test Description', publishedDate: new Date() };
      const userId = 1;
      const user = { id: userId } as User;
      const article: Article = {
        id: 1,
        ...createArticleDto,
        author: user,
      };
  
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(articleRepository, 'create').mockImplementation((dto) => ({
        id: 1,
        ...dto,
        publishedDate: dto.publishedDate || new Date(),
      } as Article));
      jest.spyOn(articleRepository, 'save').mockResolvedValue(article);
      jest.spyOn(redisClient, 'keys').mockResolvedValue(['articles:1', 'articles:2']); // Симуляция ключей
      jest.spyOn(redisClient, 'del').mockResolvedValue(1);
  
      await service.create(createArticleDto, userId);
  
      // Проверяем, что метод redisClient.del был вызван для удаления ключей
      expect(redisClient.del).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalledWith(expect.any(String)); // Проверяем, что вызов был с каким-либо аргументом
    });
  });
  
  

  describe('findAll', () => {
    it('должен вернуть список статей из кэша или базы данных', async () => {
      const user = { id: 1 } as User;
      const article = { id: 1, title: 'Test Title', description: 'Test Description', publishedDate: new Date(), author: user };
      const findAllResponse = { data: [article], total: 1 };

      jest.spyOn(redisClient, 'get').mockResolvedValue(null); // Симуляция промаха кэша
      jest.spyOn(articleRepository, 'findAndCount').mockResolvedValue([findAllResponse.data, findAllResponse.total]);
      jest.spyOn(redisClient, 'set').mockResolvedValue('OK');

      expect(await service.findAll()).toEqual(findAllResponse);
      expect(redisClient.set).toHaveBeenCalled();
    });

    it('должен вернуть список статей из кэша', async () => {
        const user = { id: 1 } as User;
        const article = { id: 1, title: 'Test Title', description: 'Test Description', publishedDate: new Date().toISOString(), author: user };
        const findAllResponse = { data: [article], total: 1 };
    
        jest.spyOn(redisClient, 'get').mockResolvedValue(JSON.stringify(findAllResponse)); // Симуляция попадания в кэш
    
        expect(await service.findAll()).toEqual(findAllResponse);
      });
  });

  describe('findOne', () => {
    it('должен вернуть статью по id', async () => {
      const user = { id: 1 } as User;
      const article = { id: 1, title: 'Test Title', description: 'Test Description', publishedDate: new Date(), author: user };

      jest.spyOn(articleRepository, 'findOne').mockResolvedValue(article as Article);

      expect(await service.findOne(1)).toEqual(article);
    });

    it('должен выбросить ошибку, если статья не найдена', async () => {
      jest.spyOn(articleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrowError('Article not found');
    });
  });

  describe('update', () => {
    it('должен обновить и вернуть статью', async () => {
      const updateArticleDto = { title: 'Updated Title' };
      const user = { id: 1 } as User;
      const updatedArticle = { id: 1, title: 'Updated Title', description: 'Test Description', publishedDate: new Date(), author: user };

      jest.spyOn(articleRepository, 'preload').mockResolvedValue(updatedArticle as Article);
      jest.spyOn(articleRepository, 'save').mockResolvedValue(updatedArticle as Article);
      jest.spyOn(redisClient, 'del').mockResolvedValue(1);

      expect(await service.update(1, updateArticleDto)).toEqual(updatedArticle);
      expect(redisClient.del).toHaveBeenCalledWith('articles:*');
    });

    it('должен выбросить ошибку, если статья не найдена для обновления', async () => {
      const updateArticleDto = { title: 'Updated Title' };

      jest.spyOn(articleRepository, 'preload').mockResolvedValue(null);

      await expect(service.update(1, updateArticleDto)).rejects.toThrowError('Article not found');
    });
  });

  describe('remove', () => {
    it('должен удалить статью', async () => {
      const id = 1;
      const userId = 1; // Предположим, что userId - это идентификатор пользователя
      const article = { id, title: 'Test Title', description: 'Test Description', publishedDate: new Date(), author: { id: userId } as User };
  
      jest.spyOn(articleRepository, 'findOne').mockResolvedValue(article as Article); // Возвращаем статью
      jest.spyOn(articleRepository, 'delete').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(redisClient, 'del').mockResolvedValue(1);
  
      await service.remove(id, userId);
  
      expect(redisClient.del).toHaveBeenCalledWith('articles:*');
    });
  
    it('должен выбросить ошибку, если статья не найдена для удаления', async () => {
      const id = 1;
      const userId = 1; // Предположим, что userId - это идентификатор пользователя
  
      jest.spyOn(articleRepository, 'findOne').mockResolvedValue(null); // Статья не найдена
      jest.spyOn(articleRepository, 'delete').mockResolvedValue({ affected: 0 } as any);
  
      await expect(service.remove(id, userId)).rejects.toThrowError('Article not found');
    });
  });  
});
