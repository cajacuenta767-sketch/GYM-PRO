import { Injectable } from '@nestjs/common';
import { CheckoutInput, PaymentProvider } from './payment-provider';

/** Pasarela de demostración: redirige a una página del portal que confirma el pago al instante. */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'MOCK' as const;
  async createCheckout(input: CheckoutInput) {
    const providerRef = `mock_${input.paymentId}`;
    const web = process.env.WEB_URL ?? 'http://localhost:5173';
    return { url: `${web}/portal/pago/${providerRef}`, providerRef, provider: this.name };
  }
  async verifyPayment() { return true; }
  async parseWebhook() { return null; }
}
