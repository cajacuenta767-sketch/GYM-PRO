import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { AlertOctagon, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';

/** Pantalla amigable para errores de renderizado o rutas inexistentes. */
export function ErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const message = isRouteErrorResponse(error) ? `${error.status} · ${error.statusText}` : error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="card max-w-md p-8 text-center animate-scale-in">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger-ink"><AlertOctagon className="h-7 w-7" /></span>
        <h1 className="mt-4 font-display text-[22px] font-bold">{is404 ? 'Página no encontrada' : 'Algo salió mal'}</h1>
        <p className="mt-2 text-[13.5px] text-ink-2">{is404 ? 'La dirección no existe o fue movida.' : 'Puedes intentar de nuevo o volver al inicio. Si el problema continúa, avisa al administrador.'}</p>
        {!is404 && <pre className="mt-3 max-h-24 overflow-auto rounded-xl bg-surface-2 p-3 text-left text-[11.5px] text-ink-3">{message}</pre>}
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}><RotateCcw className="h-4 w-4" />Reintentar</Button>
          <Link to="/"><Button><Home className="h-4 w-4" />Ir al inicio</Button></Link>
        </div>
      </div>
    </div>
  );
}
