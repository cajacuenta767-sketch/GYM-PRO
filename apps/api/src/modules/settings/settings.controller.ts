import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModuleKey, Roles } from '../../common/decorators';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Configuración')
@ApiBearerAuth()
@ModuleKey('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get() getAll() { return this.service.getAll(); }
  @Put() @Roles('ADMIN') update(@Body() dto: UpdateSettingsDto) { return this.service.update(dto.values); }
}
