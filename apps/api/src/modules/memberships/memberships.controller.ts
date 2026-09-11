import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { CreateMembershipDto, UpdateMembershipDto } from './dto/membership.dto';
import { MembershipsService } from './memberships.service';

@ApiTags('Membresías')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  @Get() findAll(@Query() query: PaginationDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @Roles('ADMIN') create(@Body() dto: CreateMembershipDto) { return this.service.create(dto); }
  @Patch(':id') @Roles('ADMIN') update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN') remove(@Param('id') id: string) { return this.service.remove(id); }
}
