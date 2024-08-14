import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Название статьи',
    example: 'Как начать изучать Docker?)'
  })
  @IsString({ message: 'Название статьи должно быть строкой' })
  @IsNotEmpty({ message: 'Название статьи не может быть пустым' })
  readonly title: string;

  @ApiProperty({
    description: 'Описание статьи',
    example: 'В этой статье мы рассмотрим основы Docker и его преимущества.'
  })
  @IsString({ message: 'Описание статьи должно быть строкой' })
  @IsNotEmpty({ message: 'Описание статьи не может быть пустым' })
  readonly description: string;

  @ApiProperty({
    description: 'Дата публикации статьи',
    required: false,
    example: '2024-08-13T00:00:00Z'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Дата публикации должна быть в формате ISO 8601' })
  readonly publishedDate?: Date; 
}
