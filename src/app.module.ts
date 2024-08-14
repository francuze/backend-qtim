import { UserService } from './api/auth/user.service';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleModule } from './api/article/article.module';
import { AuthModule } from './api/auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { Article } from './api/article/entities/article.entity';
import { User } from './api/auth/entities/user.entity';
import { ProjectMiddleware } from './project.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Article, User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRoot({
      host: 'redis',
      port: 6379,
    }),
    ArticleModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProjectMiddleware).forRoutes('*'); // Применить middleware ко всем роутам
  }
}

