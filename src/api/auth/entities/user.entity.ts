import { ApiProperty } from '@nestjs/swagger';
import { Article } from '../../article/entities/article.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class User {
  @ApiProperty({ description: 'Уникальный идентификатор пользователя', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Имя пользователя', example: 'ivan_ivanov' })
  @Column()
  username: string;

  @ApiProperty({ description: 'Электронная почта пользователя', example: 'ivan.ivanov@example.com' })
  @Column()
  email: string;

  @ApiProperty({ description: 'Хэшированный пароль пользователя', example: 'hashed_password' })
  @Column()
  password: string;

  @ApiProperty({
    description: 'Список статей, написанных пользователем',
    type: [Article],
    nullable: true,
  })
  @OneToMany(() => Article, article => article.author)
  articles: Article[];
}
