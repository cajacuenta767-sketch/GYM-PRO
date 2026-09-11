import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { CurrentUser, ModuleKey, PortalAccess, Roles } from '../../common/decorators';
import type { JwtUser } from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { NotificationsService } from './notifications.service';

class TestEmailDto { @IsEmail() to: string; }

const target = (u: JwtUser) => (u.role === 'MEMBER' ? { memberId: u.memberId ?? undefined } : { userId: u.id });

@ApiTags('Notificaciones')
@ApiBearerAuth()
@PortalAccess()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('unread-count') unread(@CurrentUser() u: JwtUser) { return this.service.unreadCount(target(u)); }
  @Get() list(@CurrentUser() u: JwtUser, @Query() q: PaginationDto & { unread?: string }) { return this.service.list(target(u), q); }
  @Patch('read-all') readAll(@CurrentUser() u: JwtUser) { return this.service.markAllRead(target(u)); }
  @Patch(':id/read') read(@CurrentUser() u: JwtUser, @Param('id') id: string) { return this.service.markRead(target(u), id); }

  @Get('logs') @Roles('ADMIN') @ModuleKey('settings') @ApiOperation({ summary: 'Historial de correos enviados o en vista previa' })
  logs(@Query() q: PaginationDto) { return this.service.logs(q); }

  @Post('test-email') @Roles('ADMIN') @ModuleKey('settings')
  test(@Body() dto: TestEmailDto) { return this.service.sendTest(dto.to); }

  @Post('run-daily') @Roles('ADMIN') @ModuleKey('settings') @ApiOperation({ summary: 'Ejecuta ahora la tarea diaria (vencimientos, cumpleaños, stock)' })
  runDaily() { return this.service.runDaily(); }
}
