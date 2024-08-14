import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateArticleDto {
  @ApiProperty({ description: 'Название статьи', required: false })
  @IsString({ message: 'Название статьи должно быть строкой.' })
  @IsOptional()
  readonly title?: string;

  @ApiProperty({ description: 'Описание статьи', required: false })
  @IsString({ message: 'Описание статьи должно быть строкой.' })
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ description: 'Дата публикации статьи', required: false })
  @IsDateString({}, { message: 'Дата публикации должна быть в формате ISO 8601.' })
  @IsOptional()
  readonly publishedAt?: Date;
}
