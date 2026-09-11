import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({ example: { gymName: 'GYM PRO', currency: 'USD' }, description: 'Mapa clave → valor' })
  @IsObject()
  values: Record<string, string | number | boolean>;
}
