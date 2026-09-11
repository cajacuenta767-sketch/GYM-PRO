import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { CreateRoleDto, QueryAccessLogsDto, UpdateRoleDto } from './dto/access.dto';
import { AccessService } from './access.service';

@ApiTags('Control de acceso')
@ApiBearerAuth()
@Controller('access')
export class AccessController {
  constructor(private readonly service: AccessService) {}

  @Get('permissions') permissions() { return this.service.permissionsCatalog(); }
  @Get('roles') roles() { return this.service.roles(); }
  @Get('roles/:id') role(@Param('id') id: string) { return this.service.role(id); }
  @Post('roles') @Roles('ADMIN') createRole(@Body() dto: CreateRoleDto) { return this.service.createRole(dto); }
  @Patch('roles/:id') @Roles('ADMIN') updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) { return this.service.updateRole(id, dto); }
  @Delete('roles/:id') @Roles('ADMIN') removeRole(@Param('id') id: string) { return this.service.removeRole(id); }
  @Get('logs') logs(@Query() query: QueryAccessLogsDto) { return this.service.accessLogs(query); }
  @Get('audit') @Roles('ADMIN') audit(@Query() query: PaginationDto) { return this.service.auditLogs(query); }
}
