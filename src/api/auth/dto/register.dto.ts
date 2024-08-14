import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'user123'
  })
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя пользователя не может быть пустым' })
  readonly username: string;

  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Электронная почта должна быть действительным адресом электронной почты' })
  @IsNotEmpty({ message: 'Электронная почта не может быть пустой' })
  readonly email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'P@ssw0rd'
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  readonly password: string;
}
