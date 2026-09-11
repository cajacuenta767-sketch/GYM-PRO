import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff } from 'lucide-react';
import { Dialog } from '@/components/ui';

/** Escáner de códigos QR con la cámara del dispositivo (jsQR sobre frames de vídeo). */
export function QrScannerDialog({ open, onOpenChange, onDetect, title = 'Escanear código QR' }: { open: boolean; onOpenChange: (o: boolean) => void; onDetect: (value: string) => void; title?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    setError(null); setReady(false);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setReady(true);
        let last = '';
        const tick = () => {
          if (stopped) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (code?.data && code.data !== last) { last = code.data; onDetect(code.data); onOpenChange(false); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e: any) {
        setError(e?.name === 'NotAllowedError' ? 'Permiso de cámara denegado. Habilítalo en el navegador.' : 'No se pudo acceder a la cámara.');
      }
    })();

    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description="Apunta la cámara al código QR del miembro." size="sm">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {!error && <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-brand/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" />}
        {!ready && !error && <div className="absolute inset-0 flex items-center justify-center text-white/80"><Camera className="h-8 w-8 animate-pulse" /></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white"><CameraOff className="h-8 w-8" /><p className="text-[13px]">{error}</p></div>}
      </div>
    </Dialog>
  );
}
