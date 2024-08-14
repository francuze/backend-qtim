import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Article {
  @ApiProperty({ description: 'Уникальный идентификатор статьи', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Заголовок статьи', example: 'Введение в NestJS' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Описание статьи', example: 'Эта статья представляет собой введение в фреймворк NestJS.' })
  @Column()
  description: string;

  @ApiProperty({ description: 'Дата публикации статьи', example: '2024-08-13T12:00:00Z' })
  @Column()
  publishedDate: Date;

  @ApiProperty({
    description: 'Автор статьи',
    type: User,
  })
  @ManyToOne(() => User, user => user.articles, { eager: true })
  author: User;
}
