import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Loader2, XCircle } from 'lucide-react';
import { post } from '@/lib/api';
import { fmtMoney } from '@/lib/format';
import { Button, Card, CardBody } from '@/components/ui';

/** Página de retorno de la pasarela (Stripe) o de simulación (proveedor MOCK). */
export default function PortalCheckoutPage() {
  const { ref } = useParams();
  const [params] = useSearchParams();
  const providerRef = ref ?? params.get('ref') ?? '';
  const isMock = providerRef.startsWith('mock_');
  const [state, setState] = useState<'idle' | 'done' | 'error'>(isMock ? 'idle' : 'idle');
  const confirm = useMutation({ mutationFn: () => post<any>('/payments/checkout/confirm', { providerRef }), onSuccess: () => setState('done'), onError: () => setState('error') });
  useEffect(() => { if (!isMock && providerRef) confirm.mutate(); }, [providerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-md animate-slide-up">
      <Card className="overflow-hidden">
        <div className="bg-side p-6 text-side-ink"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">{isMock ? 'Pasarela de demostración' : 'Confirmando pago'}</p><h1 className="mt-2 font-display text-[22px] font-bold">Pago de membresía</h1></div>
        <CardBody className="pt-6 text-center">
          {state === 'idle' && isMock && (
            <>
              <CreditCard className="mx-auto h-10 w-10 text-ink-3" />
              <p className="mt-3 text-[13.5px] text-ink-2">Esta pantalla simula la pasarela de pago. En producción verías el formulario de tarjeta de Stripe o de tu proveedor.</p>
              <p className="mt-1 font-mono text-[11.5px] text-ink-3">{providerRef}</p>
              <Button className="mt-5 w-full" size="lg" onClick={() => confirm.mutate()} loading={confirm.isPending}>Simular pago aprobado</Button>
              <Link to="/portal/pagos?cancelado=1" className="mt-3 block text-[13px] text-ink-3 hover:underline">Cancelar</Link>
            </>
          )}
          {state === 'idle' && !isMock && <><Loader2 className="mx-auto h-10 w-10 animate-spin text-ink-3" /><p className="mt-3 text-[13.5px] text-ink-2">Verificando el pago con la pasarela…</p></>}
          {state === 'done' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-3 font-display text-[20px] font-bold">¡Pago confirmado!</h2>
              <p className="mt-1 text-[13.5px] text-ink-2">Tu membresía quedó activa{confirm.data?.payment?.amount ? ` · ${fmtMoney(confirm.data.payment.amount)}` : ''}. Te enviamos la factura por correo.</p>
              <Link to="/portal" className="mt-5 block"><Button className="w-full" size="lg">Ir al inicio</Button></Link>
            </>
          )}
          {state === 'error' && <><XCircle className="mx-auto h-12 w-12 text-danger" /><h2 className="mt-3 font-display text-[20px] font-bold">No pudimos confirmar el pago</h2><p className="mt-1 text-[13.5px] text-ink-2">{(confirm.error as Error)?.message ?? 'Inténtalo de nuevo o contacta a recepción.'}</p><Link to="/portal/pagos" className="mt-5 block"><Button variant="outline" className="w-full">Volver a pagos</Button></Link></>}
        </CardBody>
      </Card>
    </div>
  );
}
