import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, FileText, Minus, Package, Plus, Receipt, ShoppingBag, ShoppingCart, Tag, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { del, download, get, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDateTime, fmtMoney, fmtMoneyDec } from '@/lib/format';
import { PAYMENT_METHOD, toOptions } from '@/lib/labels';
import type { Product, Sale } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { useList } from '@/hooks/use-list';
import { useOptions } from '@/hooks/use-options';
import { Badge, Button, Card, CardBody, CardHeader, Dialog, Drawer, Input, Label, PageHeader, SearchInput, Select, StatCard, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { DataTable } from '@/components/data-table';

const productFields: FieldConfig[] = [
  { name: 'name', label: 'Nombre del producto', required: true, colSpan: 2 },
  { name: 'sku', label: 'SKU', placeholder: 'Se genera si se deja vacío' },
  { name: 'categoryId', label: 'Categoría', type: 'select', source: 'productCategories' },
  { name: 'price', label: 'Precio de venta', type: 'number', required: true, step: 0.01 },
  { name: 'cost', label: 'Costo', type: 'number', step: 0.01 },
  { name: 'stock', label: 'Stock', type: 'number' },
  { name: 'minStock', label: 'Stock mínimo', type: 'number' },
  { name: 'imageUrl', label: 'Imagen', type: 'image' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'isActive', label: 'Activo', type: 'switch' },
];

const productColumns: Column<Product>[] = [
  { key: 'name', header: 'Producto', sortable: true, render: (p) => <div className="flex items-center gap-3"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-3 text-ink-3"><Package className="h-4 w-4" /></span><div><p className="font-medium">{p.name}</p><p className="font-mono text-[11.5px] text-ink-3">{p.sku}</p></div></div> },
  { key: 'category', header: 'Categoría', render: (p) => p.category ? <Badge>{p.category.name}</Badge> : '—' },
  { key: 'price', header: 'Precio', sortable: true, render: (p) => <b>{fmtMoneyDec(p.price)}</b> },
  { key: 'margin', header: 'Margen', render: (p) => p.price ? <span className="text-ink-2">{Math.round(((p.price - p.cost) / p.price) * 100)}%</span> : '—' },
  { key: 'stock', header: 'Stock', sortable: true, render: (p) => <Badge tone={p.stock === 0 ? 'danger' : p.stock <= p.minStock ? 'warning' : 'success'} dot>{p.stock} u.{p.stock <= p.minStock ? ' · bajo' : ''}</Badge> },
  { key: 'isActive', header: 'Estado', render: (p) => <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge> },
];

export default function StorePage() {
  const qc = useQueryClient();
  const [pos, setPos] = useState(false);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const { data: stats } = useQuery({ queryKey: ['store', 'stats'], queryFn: () => get<any>('/store/stats') });
  const { data: cats } = useOptions('productCategories');
  const sales = useList<Sale>('/store/sales', { limit: 10 });

  const saleColumns: Column<Sale>[] = [
    { key: 'number', header: 'N.º venta', sortable: true, render: (s) => <span className="font-mono text-[12.5px] font-medium">{s.number}</span> },
    { key: 'createdAt', header: 'Fecha', sortable: true, render: (s) => fmtDateTime(s.createdAt) },
    { key: 'member', header: 'Cliente', render: (s) => s.member ? `${s.member.firstName} ${s.member.lastName}` : <span className="text-ink-3">Público</span> },
    { key: 'items', header: 'Artículos', render: (s) => <span className="text-ink-2">{s.items.reduce((a, i) => a + i.quantity, 0)} u. · {s.items.map((i) => i.product.name).slice(0, 2).join(', ')}{s.items.length > 2 ? '…' : ''}</span> },
    { key: 'paymentMethod', header: 'Pago', render: (s) => <Badge>{PAYMENT_METHOD[s.paymentMethod]}</Badge> },
    { key: 'total', header: 'Total', sortable: true, render: (s) => <b className="tabular-nums">{fmtMoneyDec(s.total)}</b> },
  ];

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Operación" title="Tienda y productos" description="Inventario, ventas en mostrador y categorías de productos." actions={<Button onClick={() => setPos(true)}><ShoppingCart className="h-4 w-4" />Nueva venta</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ventas del mes" value={fmtMoney(stats?.monthRevenue)} icon={<Wallet />} tone="success" />
        <StatCard label="Transacciones" value={stats?.monthSales ?? '…'} hint="este mes" icon={<Receipt />} tone="brand" />
        <StatCard label="Productos activos" value={stats?.products ?? '…'} icon={<Package />} tone="info" />
        <StatCard label="Stock bajo" value={stats?.lowStock ?? '…'} icon={<AlertTriangle />} tone={stats?.lowStock ? 'warning' : 'neutral'} />
      </div>

      <Tabs defaultValue="productos">
        <TabsList className="mb-5"><TabsTrigger value="productos">Productos</TabsTrigger><TabsTrigger value="ventas">Ventas</TabsTrigger><TabsTrigger value="categorias">Categorías</TabsTrigger></TabsList>
        <TabsContent value="productos">
          <CrudPage<Product> title="Productos" resource="/store/products" entityName="producto" columns={productColumns} fields={productFields} emptyIcon={<ShoppingBag />}
            toolbar={(c) => <Select value={(c.filters.categoryId as string) ?? ''} onChange={(e) => c.setFilter('categoryId', e.target.value)} className="w-44"><option value="">Todas las categorías</option>{(cats ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>} />
        </TabsContent>
        <TabsContent value="ventas">
          <DataTable controller={sales} columns={saleColumns} searchPlaceholder="Buscar por n.º o cliente…" onView={(s) => setViewSale(s)} onRowClick={(s) => setViewSale(s)} actions={[{ label: 'Ticket PDF', icon: <FileText />, onClick: (s) => download(`/store/sales/${s.id}/receipt.pdf`, `ticket-${s.number}.pdf`, true) }]} emptyIcon={<Receipt />} emptyTitle="Sin ventas" />
        </TabsContent>
        <TabsContent value="categorias"><Categories /></TabsContent>
      </Tabs>

      <PosDialog open={pos} onOpenChange={setPos} onDone={() => { qc.invalidateQueries({ queryKey: ['/store/sales'] }); qc.invalidateQueries({ queryKey: ['/store/products'] }); qc.invalidateQueries({ queryKey: ['store', 'stats'] }); }} />

      <Drawer open={!!viewSale} onOpenChange={(o) => !o && setViewSale(null)} title={viewSale?.number ?? ''} description={viewSale ? fmtDateTime(viewSale.createdAt) : ''}>
        {viewSale && (
          <div className="space-y-4 text-[13.5px]">
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-ink-2">Cliente</p><p className="font-medium">{viewSale.member ? `${viewSale.member.firstName} ${viewSale.member.lastName}` : 'Público general'}</p><p className="mt-2 text-ink-2">Atendió</p><p className="font-medium">{viewSale.staff ? `${viewSale.staff.firstName} ${viewSale.staff.lastName}` : '—'}</p></div>
            <table className="w-full"><thead><tr className="text-[11.5px] uppercase tracking-wider text-ink-3"><th className="py-1 text-left">Producto</th><th className="py-1 text-right">Cant.</th><th className="py-1 text-right">Total</th></tr></thead><tbody>{viewSale.items.map((i) => <tr key={i.id} className="border-t border-line"><td className="py-2">{i.product.name}<span className="block text-[11px] text-ink-3">{fmtMoneyDec(i.unitPrice)} c/u</span></td><td className="py-2 text-right">{i.quantity}</td><td className="py-2 text-right font-medium">{fmtMoneyDec(i.total)}</td></tr>)}</tbody></table>
            <Button variant="outline" size="sm" onClick={() => download(`/store/sales/${viewSale.id}/receipt.pdf`, `ticket-${viewSale.number}.pdf`, true)}><FileText className="h-4 w-4" />Imprimir ticket</Button>
            <div className="space-y-1 border-t border-line pt-3"><p className="flex justify-between text-ink-2"><span>Subtotal</span><span>{fmtMoneyDec(viewSale.subtotal)}</span></p>{viewSale.discount > 0 && <p className="flex justify-between text-ink-2"><span>Descuento</span><span>-{fmtMoneyDec(viewSale.discount)}</span></p>}{viewSale.tax > 0 && <p className="flex justify-between text-ink-2"><span>Impuesto</span><span>{fmtMoneyDec(viewSale.tax)}</span></p>}<p className="flex justify-between font-display text-[18px] font-bold"><span>Total</span><span>{fmtMoneyDec(viewSale.total)}</span></p><p className="text-right text-[12px] text-ink-3">{PAYMENT_METHOD[viewSale.paymentMethod]}</p></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Categories() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const { data } = useQuery({ queryKey: ['/store/categories'], queryFn: () => get<any[]>('/store/categories') });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['/store/categories'] }); qc.invalidateQueries({ queryKey: ['options', 'productCategories'] }); };
  const create = useMutation({ mutationFn: () => post('/store/categories', { name }), onSuccess: () => { setName(''); toast.success('Categoría creada'); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (id: string) => del(`/store/categories/${id}`), onSuccess: () => { toast.success('Categoría eliminada'); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <Card className="max-w-xl">
      <CardHeader title="Categorías de producto" icon={<Tag />} />
      <CardBody>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }} className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría…" /><Button type="submit" loading={create.isPending}><Plus className="h-4 w-4" />Agregar</Button></form>
        <ul className="mt-4 divide-y divide-line">
          {data?.map((c) => <li key={c.id} className="flex items-center justify-between py-2.5"><span className="font-medium">{c.name}</span><span className="flex items-center gap-3 text-[12.5px] text-ink-3">{c._count.products} productos<Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button></span></li>)}
        </ul>
      </CardBody>
    </Card>
  );
}

/** Punto de venta: selección de productos, cantidades, cliente y método de pago. */
function PosDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [memberId, setMemberId] = useState('');
  const [method, setMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const { data: products } = useQuery({ queryKey: ['/store/products', 'pos'], queryFn: () => get<Product[]>('/store/products', { limit: 200 }), enabled: open });
  const { data: members } = useOptions('members');
  const filtered = useMemo(() => (products ?? []).filter((p) => p.isActive && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))), [products, search]);
  const lines = Object.entries(cart).flatMap(([id, qty]) => { const product = products?.find((p) => p.id === id); return product ? [{ product, qty }] : []; });
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const sell = useMutation({
    mutationFn: () => post<Sale>('/store/sales', { memberId: memberId || undefined, paymentMethod: method, discount, items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })) }),
    onSuccess: (s) => { toast.success(`Venta ${s.number} registrada · ${fmtMoneyDec(s.total)}`); setCart({}); setDiscount(0); setMemberId(''); onOpenChange(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const add = (p: Product, delta: number) => setCart((c) => { const q = Math.max(0, Math.min(p.stock, (c[p.id] ?? 0) + delta)); const n = { ...c }; if (q === 0) delete n[p.id]; else n[p.id] = q; return n; });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Nueva venta" description="Selecciona productos y confirma el cobro." size="xl"
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => sell.mutate()} disabled={!lines.length} loading={sell.isPending}><ShoppingCart className="h-4 w-4" />Cobrar {fmtMoneyDec(total)}</Button></>}>
      <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <div>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto o SKU…" />
          <div className="mt-3 grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-3">
            {filtered.map((p) => {
              const qty = cart[p.id] ?? 0;
              return (
                <button key={p.id} onClick={() => add(p, 1)} disabled={p.stock === 0} className={cn('rounded-xl border p-3 text-left transition-colors focus-ring disabled:opacity-40', qty ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-line-strong hover:bg-surface-2')}>
                  <p className="line-clamp-2 text-[12.5px] font-medium leading-snug">{p.name}</p>
                  <p className="mt-1 text-[13px] font-bold">{fmtMoneyDec(p.price)}</p>
                  <p className="text-[11px] text-ink-3">{p.stock} en stock</p>
                  {qty > 0 && <span className="mt-1 inline-block rounded-md bg-brand px-1.5 text-[11px] font-bold text-[#14161C]">×{qty}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col rounded-2xl border border-line bg-surface-2/50 p-4">
          <p className="font-display text-[14px] font-semibold">Carrito</p>
          <div className="mt-2 flex-1 space-y-2 overflow-y-auto scrollbar-thin">
            {!lines.length && <p className="py-8 text-center text-[12.5px] text-ink-3">Agrega productos para comenzar.</p>}
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 rounded-xl bg-surface p-2">
                <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-medium">{l.product.name}</p><p className="text-[11px] text-ink-3">{fmtMoneyDec(l.product.price)} × {l.qty}</p></div>
                <Button variant="outline" size="icon-sm" onClick={() => add(l.product, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-5 text-center text-[13px] font-semibold">{l.qty}</span>
                <Button variant="outline" size="icon-sm" onClick={() => add(l.product, 1)}><Plus className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <div><Label>Cliente (opcional)</Label><Select value={memberId} onChange={(e) => setMemberId(e.target.value)}><option value="">Público general</option>{(members ?? []).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Método</Label><Select value={method} onChange={(e) => setMethod(e.target.value)}>{toOptions(PAYMENT_METHOD).filter((o) => o.value !== 'STRIPE').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
              <div><Label>Descuento</Label><Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /></div>
            </div>
            <div className="flex items-end justify-between"><span className="text-[12.5px] text-ink-2">Subtotal {fmtMoneyDec(subtotal)}</span><span className="font-display text-[22px] font-bold">{fmtMoneyDec(total)}</span></div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
