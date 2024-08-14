import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateArticleDto } from './dto/create-article.dto';
import { Article } from './entities/article.entity';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator'; // Декоратор для получения текущего пользователя
import { User } from 'src/api/auth/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('articles') // Тэг для группировки в Swagger
@ApiBearerAuth('access-token') // Требование авторизации через Bearer токен
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Защищаем маршрут, требуем авторизацию
  @ApiOperation({ summary: 'Создать новую статью' }) // Описание операции
  @ApiResponse({ status: 201, description: 'Статья успешно создана.', type: Article })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: User, // Используем декоратор для получения текущего пользователя
  ): Promise<Article> {
    return this.articleService.create(createArticleDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список статей' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы для пагинации. По умолчанию 1.' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице. По умолчанию 10.' })
  @ApiQuery({ 
    name: 'filter', 
    required: false, 
    type: String, 
    description: 'Критерии фильтрации в формате JSON. Пример: {"title": "пример", "authorId": 1, "startDate": "2024-01-01", "endDate": "2024-12-31"}' 
  })
  @ApiResponse({ status: 200, description: 'Список статей', type: [Article] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter: string = '{}'
  ): Promise<{ data: Article[]; total: number }> {
    // Пытаемся распарсить фильтр как JSON
    const filterObj = JSON.parse(filter || '{}');
    return this.articleService.findAll(page, limit, filterObj);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить статью по ID' })
  @ApiResponse({ status: 200, description: 'Детали статьи', type: Article })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
  async findOne(@Param('id') id: string): Promise<Article> {
    return this.articleService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить статью по ID' })
  @ApiResponse({ status: 200, description: 'Обновленная статья', type: Article })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto
  ): Promise<Article> {
    return this.articleService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить статью по ID' })
  @ApiResponse({ status: 204, description: 'Статья успешно удалена.' })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    await this.articleService.remove(+id, user.id); // Передаем user.id в сервис
  }
}
