import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';
import { CreateGroupDto, GroupMembersDto, UpdateGroupDto } from './dto/group.dto';
import { GroupsService } from './groups.service';

@ApiTags('Grupos')
@ApiBearerAuth()
@ModuleKey('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Get() findAll(@Query() query: PaginationDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateGroupDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGroupDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Post(':id/members') addMembers(@Param('id') id: string, @Body() dto: GroupMembersDto) { return this.service.addMembers(id, dto.memberIds); }
  @Delete(':id/members/:memberId') removeMember(@Param('id') id: string, @Param('memberId') memberId: string) { return this.service.removeMember(id, memberId); }
}
