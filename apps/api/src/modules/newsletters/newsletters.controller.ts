import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateNewsletterDto, QueryNewslettersDto, UpdateNewsletterDto } from './dto/newsletter.dto';
import { NewslettersService } from './newsletters.service';

@ApiTags('Boletín informativo')
@ApiBearerAuth()
@ModuleKey('newsletters')
@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly service: NewslettersService) {}

  @Get() findAll(@Query() query: QueryNewslettersDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateNewsletterDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateNewsletterDto) { return this.service.update(id, dto); }
  @Post(':id/send') send(@Param('id') id: string) { return this.service.send(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
