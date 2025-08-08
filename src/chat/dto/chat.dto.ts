import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ description: 'The message from the user' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'The user ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}