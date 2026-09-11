import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { paginate, sequential, startOfMonth } from '../../common/utils';
import { CreateProductCategoryDto, CreateProductDto, CreateSaleDto, QueryProductsDto, UpdateProductDto } from './dto/product.dto';
import PDFDocument from 'pdfkit';

const productInclude = { category: { select: { id: true, name: true } } };
const saleInclude = {
  member: { select: { id: true, code: true, firstName: true, lastName: true } },
  staff: { select: { id: true, firstName: true, lastName: true } },
  items: { include: { product: { select: { id: true, name: true, sku: true } } } },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ── Productos ──
  findAll(query: QueryProductsDto) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    return paginate(this.prisma.product, query, {
      where,
      include: productInclude,
      searchFields: ['name', 'sku', 'category.name'],
      sortable: ['name', 'sku', 'price', 'stock', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
  }

  async lowStock() {
    const rows = await this.prisma.product.findMany({ where: { isActive: true }, include: productInclude, orderBy: { stock: 'asc' } });
    return rows.filter((p) => p.stock <= p.minStock);
  }

  findOne(id: string) { return this.prisma.product.findUniqueOrThrow({ where: { id }, include: productInclude }); }

  async create(dto: CreateProductDto) {
    const sku = dto.sku ?? `SKU-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.product.create({ data: { ...dto, sku }, include: productInclude });
  }

  update(id: string, dto: UpdateProductDto) { return this.prisma.product.update({ where: { id }, data: dto, include: productInclude }); }
  remove(id: string) { return this.prisma.product.delete({ where: { id }, select: { id: true } }); }

  // ── Categorías ──
  findCategories() {
    return this.prisma.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  }
  createCategory(dto: CreateProductCategoryDto) { return this.prisma.productCategory.create({ data: dto }); }
  removeCategory(id: string) { return this.prisma.productCategory.delete({ where: { id }, select: { id: true } }); }

  // ── Ventas ──
  findSales(query: PaginationDto) {
    return paginate(this.prisma.sale, query, {
      include: saleInclude,
      searchFields: ['number', 'member.firstName', 'member.lastName'],
      sortable: ['number', 'total', 'createdAt'],
      defaultSort: { createdAt: 'desc' },
    });
  }

  findSale(id: string) { return this.prisma.sale.findUniqueOrThrow({ where: { id }, include: saleInclude }); }

  async createSale(dto: CreateSaleDto) {
    if (!dto.items?.length) throw new BadRequestException('La venta debe incluir al menos un producto');
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });
    const map = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const items = dto.items.map((item) => {
      const product = map.get(item.productId);
      if (!product) throw new BadRequestException(`Producto ${item.productId} no existe`);
      if (product.stock < item.quantity) throw new BadRequestException(`Stock insuficiente para ${product.name}`);
      const total = product.price * item.quantity;
      subtotal += total;
      return { productId: product.id, quantity: item.quantity, unitPrice: product.price, total };
    });

    const discount = dto.discount ?? 0;
    const taxSetting = await this.prisma.setting.findUnique({ where: { key: 'taxRate' } });
    const taxRate = taxSetting ? Number(taxSetting.value) : 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * (taxRate / 100) * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;

    const count = await this.prisma.sale.count();
    const number = sequential('VTA', count + 1);

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          number, memberId: dto.memberId, staffId: dto.staffId, subtotal, discount, tax, total,
          paymentMethod: dto.paymentMethod ?? 'CASH', notes: dto.notes,
          items: { create: items },
        },
        include: saleInclude,
      });
      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      return sale;
    });
  }

  /** Ticket de venta (80 mm) en PDF. */
  async receiptPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const sale = await this.findSale(id);
    const settings = Object.fromEntries((await this.prisma.setting.findMany({ where: { key: { in: ['gymName', 'address', 'phone', 'currencySymbol'] } } })).map((s) => [s.key, s.value]));
    const sym = settings.currencySymbol ?? '$';
    const money = (n: number) => `${sym}${n.toFixed(2)}`;
    const methods: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
    const W = 226; const H = 260 + sale.items.length * 16;
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: [W, H], margin: 14 });
      const chunks: Buffer[] = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
      doc.font('Helvetica-Bold').fontSize(12).text(settings.gymName ?? 'GYM PRO', { align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#555').text([settings.address, settings.phone].filter(Boolean).join(' · '), { align: 'center' });
      doc.moveDown(0.6).fillColor('#000').fontSize(8).text(`Venta ${sale.number}`).text(sale.createdAt.toLocaleString('es-CO')).text(`Cliente: ${sale.member ? `${sale.member.firstName} ${sale.member.lastName}` : 'Público general'}`);
      doc.moveDown(0.4); const y0 = doc.y; doc.moveTo(14, y0).lineTo(W - 14, y0).dash(2, { space: 2 }).stroke('#999').undash(); doc.moveDown(0.4);
      for (const it of sale.items) { const y = doc.y; doc.fontSize(8).text(`${it.quantity} × ${it.product.name}`, 14, y, { width: 140 }); doc.text(money(it.total), 150, y, { width: 62, align: 'right' }); doc.moveDown(0.2); }
      doc.moveDown(0.3); const y1 = doc.y; doc.moveTo(14, y1).lineTo(W - 14, y1).dash(2, { space: 2 }).stroke('#999').undash(); doc.moveDown(0.4);
      const line = (l: string, v: string, bold = false) => { const y = doc.y; doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8).text(l, 14, y, { width: 120 }); doc.text(v, 130, y, { width: 82, align: 'right' }); doc.moveDown(0.15); };
      line('Subtotal', money(sale.subtotal)); if (sale.discount) line('Descuento', `-${money(sale.discount)}`); if (sale.tax) line('Impuesto', money(sale.tax)); line('TOTAL', money(sale.total), true); line('Pago', methods[sale.paymentMethod] ?? sale.paymentMethod);
      doc.moveDown(0.8).font('Helvetica').fontSize(7).fillColor('#555').text('¡Gracias por tu compra!', { align: 'center' });
      doc.end();
    });
    return { buffer, filename: `ticket-${sale.number}.pdf` };
  }

  async salesStats() {
    const monthStart = startOfMonth(new Date());
    const [monthAgg, totalProducts, low, salesCount] = await Promise.all([
      this.prisma.sale.aggregate({ _sum: { total: true }, where: { createdAt: { gte: monthStart } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.lowStock(),
      this.prisma.sale.count({ where: { createdAt: { gte: monthStart } } }),
    ]);
    return { monthRevenue: monthAgg._sum.total ?? 0, monthSales: salesCount, products: totalProducts, lowStock: low.length };
  }
}
