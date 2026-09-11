import { Module } from '@nestjs/common';
import { ClassesModule } from '../classes/classes.module';
import { PublicController } from './public.controller';

@Module({ imports: [ClassesModule], controllers: [PublicController] })
export class PublicModule {}
