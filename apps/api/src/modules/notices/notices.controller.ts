import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateNoticeDto, QueryNoticesDto, UpdateNoticeDto } from './dto/notice.dto';
import { NoticesService } from './notices.service';

@ApiTags('Avisos')
@ApiBearerAuth()
@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Get('active') active() { return this.service.active(); }
  @Get() findAll(@Query() query: QueryNoticesDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateNoticeDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateNoticeDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
