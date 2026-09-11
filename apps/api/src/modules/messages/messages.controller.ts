import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators';
import { CreateMessageDto, QueryMessagesDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Mensajes')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get('contacts') contacts() { return this.service.contacts(); }
  @Get('unread-count') unread(@CurrentUser('id') userId: string) { return this.service.unreadCount(userId); }
  @Get() findAll(@CurrentUser('id') userId: string, @Query() query: QueryMessagesDto) { return this.service.findAll(userId, query); }
  @Get(':id') findOne(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.findOne(userId, id); }
  @Post() send(@CurrentUser('id') userId: string, @Body() dto: CreateMessageDto) { return this.service.send(userId, dto); }
  @Patch(':id/read') read(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.markRead(userId, id); }
  @Delete(':id') remove(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.service.remove(userId, id); }
}
