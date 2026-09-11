import PDFDocument from 'pdfkit';

export interface InvoiceData {
  gym: { name: string; address?: string; phone?: string; email?: string; taxId?: string };
  invoiceNumber: string; date: Date; status: string; method: string;
  member: { name: string; code: string; email?: string | null };
  concept: string; amount: number; currency: string; symbol: string; notes?: string | null;
}

/** Genera la factura en PDF (A4) como Buffer. */
export function buildInvoicePdf(d: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n: number) => `${d.symbol}${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${d.currency}`;

    // Cabecera
    doc.rect(0, 0, doc.page.width, 110).fill('#14161C');
    doc.fillColor('#C3F13D').font('Helvetica-Bold').fontSize(22).text(d.gym.name, 48, 40);
    doc.fillColor('#B8BCC8').font('Helvetica').fontSize(10).text([d.gym.address, d.gym.phone, d.gym.email].filter(Boolean).join(' · '), 48, 68);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('FACTURA', 400, 40, { align: 'right', width: 147 });
    doc.fillColor('#B8BCC8').font('Helvetica').fontSize(10).text(d.invoiceNumber, 400, 62, { align: 'right', width: 147 });

    // Datos
    doc.fillColor('#1B1A17');
    let y = 140;
    doc.font('Helvetica-Bold').fontSize(10).text('FACTURAR A', 48, y);
    doc.font('Helvetica-Bold').fontSize(12).text(d.member.name, 48, y + 16);
    doc.font('Helvetica').fontSize(10).fillColor('#6B6960').text(`Miembro ${d.member.code}${d.member.email ? ` · ${d.member.email}` : ''}`, 48, y + 32);
    doc.fillColor('#1B1A17').font('Helvetica-Bold').fontSize(10).text('DETALLES', 360, y);
    doc.font('Helvetica').fontSize(10).fillColor('#6B6960')
      .text(`Fecha: ${d.date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, 360, y + 16)
      .text(`Método: ${d.method}`, 360, y + 30)
      .text(`Estado: ${d.status}`, 360, y + 44);

    // Tabla
    y = 230;
    doc.rect(48, y, 499, 26).fill('#F1F0EB');
    doc.fillColor('#6B6960').font('Helvetica-Bold').fontSize(9).text('CONCEPTO', 60, y + 9).text('CANT.', 380, y + 9, { width: 40, align: 'right' }).text('IMPORTE', 440, y + 9, { width: 95, align: 'right' });
    y += 36;
    doc.fillColor('#1B1A17').font('Helvetica').fontSize(11).text(d.concept, 60, y, { width: 300 }).text('1', 380, y, { width: 40, align: 'right' }).text(money(d.amount), 440, y, { width: 95, align: 'right' });
    y += 34;
    doc.moveTo(48, y).lineTo(547, y).strokeColor('#E6E4DD').stroke();
    y += 14;
    doc.font('Helvetica-Bold').fontSize(13).text('TOTAL', 360, y, { width: 80 }).text(money(d.amount), 440, y, { width: 95, align: 'right' });

    if (d.notes) { y += 40; doc.font('Helvetica').fontSize(10).fillColor('#6B6960').text(`Notas: ${d.notes}`, 48, y, { width: 499 }); }

    doc.fontSize(9).fillColor('#9A9890').text('Gracias por entrenar con nosotros. Documento generado por GYM PRO.', 48, doc.page.height - 80, { align: 'center', width: 499 });
    doc.end();
  });
}
