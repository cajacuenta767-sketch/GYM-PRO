import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { CheckoutInput, PaymentProvider } from './payment-provider';

/** Stripe Checkout. Activo cuando existe STRIPE_SECRET_KEY. */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'STRIPE' as const;
  private readonly logger = new Logger('Stripe');
  private client: Stripe | null = null;
  private get stripe() {
    if (!this.client) this.client = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', { apiVersion: '2024-12-18.acacia' as any });
    return this.client;
  }

  async createCheckout(input: CheckoutInput) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail ?? undefined,
      line_items: [{ quantity: 1, price_data: { currency: input.currency.toLowerCase(), unit_amount: Math.round(input.amount * 100), product_data: { name: input.concept } } }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { paymentId: input.paymentId },
    });
    return { url: session.url!, providerRef: session.id, provider: this.name };
  }

  async verifyPayment(providerRef: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(providerRef);
      return session.payment_status === 'paid';
    } catch (e: any) {
      this.logger.warn(`No se pudo verificar la sesión ${providerRef}: ${e.message}`);
      return false;
    }
  }

  async parseWebhook(rawBody: Buffer, signature?: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;
    try {
      event = secret && signature ? this.stripe.webhooks.constructEvent(rawBody, signature, secret) : (JSON.parse(rawBody.toString()) as Stripe.Event);
    } catch (e: any) {
      this.logger.warn(`Webhook rechazado: ${e.message}`);
      return null;
    }
    if (event.type === 'checkout.session.completed') return { providerRef: (event.data.object as Stripe.Checkout.Session).id, status: 'PAID' as const };
    if (event.type === 'checkout.session.expired') return { providerRef: (event.data.object as Stripe.Checkout.Session).id, status: 'FAILED' as const };
    return null;
  }
}
