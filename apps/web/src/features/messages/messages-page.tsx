import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Mail, MailOpen, PenSquare, Reply, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, list, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { USER_ROLE } from '@/lib/labels';
import type { Message } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';
import { Avatar, Badge, Button, Card, Dialog, EmptyState, PageHeader, SearchInput, Skeleton } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';

const fields: FieldConfig[] = [
  { name: 'recipientId', label: 'Para', type: 'select', source: 'contacts', required: true, colSpan: 2 },
  { name: 'subject', label: 'Asunto', required: true, colSpan: 2 },
  { name: 'body', label: 'Mensaje', type: 'textarea', required: true },
];

export default function MessagesPage() {
  const qc = useQueryClient();
  const [box, setBox] = useState<'inbox' | 'sent'>('inbox');
  const [search, setSearch] = useState('');
  const term = useDebounce(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | Partial<{ recipientId: string; subject: string }>>(null);

  const { data, isLoading } = useQuery({ queryKey: ['/messages', box, term], queryFn: () => list<Message>('/messages', { box, search: term, limit: 50 }) });
  const { data: msg } = useQuery({ queryKey: ['/messages', 'one', selectedId], queryFn: () => get<Message>(`/messages/${selectedId}`), enabled: !!selectedId });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['/messages'] }); qc.invalidateQueries({ queryKey: ['messages', 'unread-count'] }); };
  useEffect(() => { setSelectedId(null); }, [box]);
  useEffect(() => { if (msg && !msg.readAt && box === 'inbox') invalidate(); }, [msg]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useMutation({ mutationFn: (v: any) => post('/messages', v), onSuccess: () => { toast.success('Mensaje enviado'); setCompose(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (id: string) => del(`/messages/${id}`), onSuccess: () => { toast.success('Mensaje eliminado'); setSelectedId(null); invalidate(); } });

  const rows = data?.data ?? [];
  const unread = rows.filter((m) => !m.readAt && box === 'inbox').length;

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Comunicación" title="Mensajes" description="Mensajería interna entre administración, recepción y entrenadores." actions={<Button onClick={() => setCompose({})}><PenSquare className="h-4 w-4" />Nuevo mensaje</Button>} />
      <Card className="grid min-h-[600px] overflow-hidden lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col border-b border-line lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-line p-3">
            <div className="flex rounded-xl bg-surface-2 p-1">
              {(['inbox', 'sent'] as const).map((b) => <button key={b} onClick={() => setBox(b)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium transition-colors', box === b ? 'bg-surface text-ink shadow-card' : 'text-ink-2')}>{b === 'inbox' ? <><Inbox className="h-4 w-4" />Recibidos{unread > 0 && <Badge tone="brand">{unread}</Badge>}</> : <><Send className="h-4 w-4" />Enviados</>}</button>)}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar mensajes…" />
          </div>
          <ul className="flex-1 divide-y divide-line overflow-y-auto scrollbar-thin max-h-[520px]">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <li key={i} className="p-4"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="mt-2 h-3 w-4/5" /></li>)}
            {!isLoading && rows.length === 0 && <li><EmptyState icon={<Mail />} title="Sin mensajes" /></li>}
            {rows.map((m) => {
              const person = box === 'inbox' ? m.sender : m.recipient;
              const isUnread = box === 'inbox' && !m.readAt;
              return (
                <li key={m.id}>
                  <button onClick={() => setSelectedId(m.id)} className={cn('flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-surface-2', selectedId === m.id && 'bg-brand-soft/50')}>
                    <Avatar name={person.name} src={person.avatarUrl} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className={cn('truncate text-[13.5px]', isUnread ? 'font-bold text-ink' : 'font-medium text-ink')}>{person.name}</span><span className="shrink-0 text-[11px] text-ink-3">{fmtRelative(m.createdAt)}</span></span>
                      <span className={cn('block truncate text-[13px]', isUnread ? 'font-semibold text-ink' : 'text-ink-2')}>{m.subject}</span>
                      <span className="block truncate text-[12px] text-ink-3">{m.body}</span>
                    </span>
                    {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col">
          {!selectedId ? <EmptyState icon={<MailOpen />} title="Selecciona un mensaje" description="Elige un mensaje de la lista para leerlo." className="flex-1" /> : !msg ? <div className="p-6"><Skeleton className="h-6 w-1/2" /><Skeleton className="mt-4 h-40" /></div> : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-line p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={msg.sender.name} src={msg.sender.avatarUrl} size="lg" />
                  <div><h2 className="font-display text-[17px] font-semibold leading-tight">{msg.subject}</h2><p className="mt-0.5 text-[12.5px] text-ink-2"><b className="text-ink">{msg.sender.name}</b> · {USER_ROLE[msg.sender.role]} → {msg.recipient.name}</p><p className="text-[11.5px] text-ink-3">{fmtDateTime(msg.createdAt)}{msg.readAt ? ` · leído ${fmtRelative(msg.readAt)}` : ''}</p></div>
                </div>
                <div className="flex gap-1">
                  {box === 'inbox' && <Button variant="outline" size="sm" onClick={() => setCompose({ recipientId: msg.senderId, subject: `RE: ${msg.subject}` })}><Reply className="h-4 w-4" />Responder</Button>}
                  <Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => remove.mutate(msg.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex-1 whitespace-pre-line p-6 text-[14px] leading-relaxed text-ink">{msg.body}</div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={!!compose} onOpenChange={(o) => !o && setCompose(null)} title="Nuevo mensaje" footer={<><Button variant="ghost" onClick={() => setCompose(null)}>Cancelar</Button><Button type="submit" form="msg-form" loading={send.isPending}><Send className="h-4 w-4" />Enviar</Button></>}>
        <AutoForm id="msg-form" fields={fields} defaultValues={compose ?? undefined} onSubmit={(v) => send.mutate(v)} />
      </Dialog>
    </div>
  );
}
