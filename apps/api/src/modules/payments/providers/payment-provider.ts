export interface CheckoutInput {
  paymentId: string;
  amount: number;
  currency: string;
  concept: string;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}
export interface CheckoutResult { url: string; providerRef: string; provider: 'STRIPE' | 'MOCK' }

/** Contrato común para pasarelas de pago. Añadir Wompi/MercadoPago implica una clase más. */
export interface PaymentProvider {
  readonly name: 'STRIPE' | 'MOCK';
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Devuelve el providerRef confirmado a partir del webhook (o null si el evento no aplica). */
  parseWebhook(rawBody: Buffer, signature?: string): Promise<{ providerRef: string; status: 'PAID' | 'FAILED' } | null>;
}
