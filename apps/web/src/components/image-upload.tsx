import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { assetUrl, upload } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Campo de imagen: arrastrar o seleccionar, sube a /uploads y devuelve la URL. */
export function ImageUpload({ value, onChange, className, shape = 'square' }: { value?: string | null; onChange: (url: string | null) => void; className?: string; shape?: 'square' | 'wide' }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const send = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecciona una imagen'); return; }
    setBusy(true);
    try { const r = await upload<{ url: string }>('/uploads', file); onChange(r.url); toast.success('Imagen subida'); }
    catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files?.[0]); }}
        className={cn('relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-surface-2/60 transition-colors', shape === 'square' ? 'h-24 w-24' : 'h-24 w-40', over ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-line-strong')}
      >
        {value ? <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-ink-3" />}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-surface/70"><Loader2 className="h-5 w-5 animate-spin" /></span>}
      </div>
      <div className="text-[12.5px] text-ink-2">
        <p><button type="button" onClick={() => input.current?.click()} className="font-semibold text-brand-ink hover:underline">Subir imagen</button> o arrástrala aquí.</p>
        <p className="text-ink-3">JPG, PNG o WEBP · máx. 5 MB</p>
        {value && <button type="button" onClick={() => onChange(null)} className="mt-1 inline-flex items-center gap-1 text-danger-ink hover:underline"><Trash2 className="h-3 w-3" />Quitar</button>}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { send(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}
