import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { Article } from './entities/article.entity';
import { RedisModule } from 'src/redis/redis.module';
import { UserService } from '../auth/user.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Article, User]), // Импортируйте репозиторий
        RedisModule, // Импортируйте RedisModule
        AuthModule
      ],
    controllers: [ArticleController],
    providers: [ArticleService],
})
export class ArticleModule { }
