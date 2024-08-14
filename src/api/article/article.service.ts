import { Injectable, NotFoundException, Inject, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async create(createArticleDto: CreateArticleDto, userId: number): Promise<Article> {
    const author = await this.userRepository.findOne({ where: { id: userId } });
  
    if (!author) {
      throw new NotFoundException('Author not found');
    }
  
    const article = this.articleRepository.create({
      ...createArticleDto,
      author,
    });
  
    await this.articleRepository.save(article);
  
    // Инвалидация всех кэшей
    console.log('Invalidating cache');
    const keys = await this.redisClient.keys('articles:*');
    console.log('Keys:', keys);
    await Promise.all(keys.map(key => this.redisClient.del(key)));
    
    return article;
  }
  
  

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter: any = {},
  ): Promise<{ data: Article[]; total: number }> {
    // Создаем ключ для кэша на основе параметров
    const cacheKey = `articles:${page}:${limit}:${JSON.stringify(filter)}`;
    const cachedArticles = await this.redisClient.get(cacheKey);
  
    if (cachedArticles) {
      return JSON.parse(cachedArticles);
    }
  
    // Используем QueryBuilder для гибкой фильтрации
    const query = this.articleRepository.createQueryBuilder('article');
  
    // Фильтрация по названию
    if (filter.title) {
      query.andWhere('article.title LIKE :title', { title: `%${filter.title}%` });
    }
  
    // Фильтрация по автору
    if (filter.authorId) {
      query.innerJoinAndSelect('article.author', 'author')
           .andWhere('author.id = :authorId', { authorId: filter.authorId });
    }
  
    // Фильтрация по дате публикации
    if (filter.startDate && filter.endDate) {
      query.andWhere('article.publishedDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }
  
    // Пагинация
    query.skip((page - 1) * limit).take(limit);
  
    // Выполняем запрос и считаем количество записей
    const [data, total] = await query.getManyAndCount();
  
    // Кэшируем результаты
    await this.redisClient.set(cacheKey, JSON.stringify({ data, total }), 'EX', 60);
  
    return { data, total };
  }
  

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const article = await this.articleRepository.preload({
      id,
      ...updateArticleDto,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.articleRepository.save(article);

    // Инвалидация кэша
    await this.redisClient.del('articles:*');

    return article;
  }

  async remove(id: number, userId: number): Promise<void> {
    const article = await this.findOne(id);

    // Проверка, что текущий пользователь является автором статьи
    if (article.author.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this article');
    }

    const result = await this.articleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Article not found');
    }

    // Инвалидация кэша
    await this.redisClient.del('articles:*');
  }
}
