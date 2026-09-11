import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class CreateMessageDto {
  @ApiProperty() @IsString() recipientId: string;
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() body: string;
}

export class QueryMessagesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ['inbox', 'sent'] }) @IsOptional() @IsIn(['inbox', 'sent']) box?: 'inbox' | 'sent';
  @ApiPropertyOptional() @IsOptional() unread?: string;
}
