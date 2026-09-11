import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { ClassesModule } from '../classes/classes.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { PaymentsModule } from '../payments/payments.module';
import { RoutinesModule } from '../routines/routines.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({ imports: [ClassesModule, BookingsModule, NutritionModule, RoutinesModule, PaymentsModule], controllers: [PortalController], providers: [PortalService] })
export class PortalModule {}
