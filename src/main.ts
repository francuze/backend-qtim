import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Удаляет свойства, не указанные в DTO
    forbidNonWhitelisted: true, // Выбрасывает ошибку, если найдены не указанные свойства
    transform: true, // Преобразует входные данные в типы DTO
  }));

  const config = new DocumentBuilder()
    .setTitle('API Статей')
    .setDescription('Описание API для работы со статьями')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .setVersion('1.0')
    .build();
  
  // Создаем Swagger Модуль для начало работы
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
