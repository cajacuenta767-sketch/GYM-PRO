import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock.provider';
import { StripePaymentProvider } from './providers/stripe.provider';

@Module({ controllers: [PaymentsController], providers: [PaymentsService, StripePaymentProvider, MockPaymentProvider], exports: [PaymentsService] })
export class PaymentsModule {}
