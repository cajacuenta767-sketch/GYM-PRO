import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, MinLength } from 'class-validator';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BulkMembersDto, CreateMeasurementDto, CreateMemberDto, QueryMembersDto, UpdateMemberDto } from './dto/member.dto';

class PortalAccountDto { @IsString() @MinLength(6) password: string; }
import { MembersService } from './members.service';

@ApiTags('Miembros')
@ApiBearerAuth()
@ModuleKey('members')
@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get('stats') @ApiOperation({ summary: 'Indicadores de miembros' })
  stats() { return this.service.stats(); }

  @Get('qr/:token') @ApiOperation({ summary: 'Buscar miembro por su código QR' })
  byQr(@Param('token') token: string) { return this.service.findByQr(token); }

  @Get('export') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="miembros.csv"')
  export(@Query() query: QueryMembersDto) { return this.service.exportCsv(query); }

  @Get('import/template') @Header('Content-Type', 'text/csv; charset=utf-8') @Header('Content-Disposition', 'attachment; filename="plantilla-miembros.csv"')
  template() { return this.service.importTemplateCsv(); }

  @Post('import') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) @ApiOperation({ summary: 'Importar miembros desde CSV o Excel' })
  import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Adjunta un archivo CSV o XLSX');
    return this.service.importFile(file.buffer, file.originalname);
  }

  @Post('bulk') @ApiOperation({ summary: 'Acciones en lote: estado, entrenador, grupo o sede' })
  bulk(@Body() dto: BulkMembersDto) { return this.service.bulk(dto); }

  @Post(':id/portal-account') @ApiOperation({ summary: 'Crear o restablecer la cuenta del portal del miembro' })
  portalAccount(@Param('id') id: string, @Body() dto: PortalAccountDto) { return this.service.createPortalAccount(id, dto.password); }

  @Get() findAll(@Query() query: QueryMembersDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateMemberDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMemberDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/measurements') @ApiQuery({ name: 'type', required: false })
  measurements(@Param('id') id: string, @Query('type') type?: string) { return this.service.listMeasurements(id, type); }

  @Post(':id/measurements')
  addMeasurement(@Param('id') id: string, @Body() dto: CreateMeasurementDto) { return this.service.addMeasurement(id, dto); }

  @Delete(':id/measurements/:measurementId')
  removeMeasurement(@Param('id') id: string, @Param('measurementId') mid: string) { return this.service.removeMeasurement(id, mid); }
}
