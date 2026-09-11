import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export interface CardData { gym: string; name: string; code: string; plan?: string | null; expiresAt?: Date | null; qrToken: string; branch?: string | null; joinDate: Date }

/** Carnet de miembro en formato tarjeta (85.6 × 54 mm) con código QR de acceso. */
export async function buildMemberCardPdf(d: CardData): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(d.qrToken, { type: 'png', margin: 0, width: 300, color: { dark: '#14161C', light: '#FFFFFF' } });
  return new Promise((resolve, reject) => {
    const W = 242.6, H = 153; // puntos (mm × 2.835)
    const doc = new PDFDocument({ size: [W, H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);

    doc.rect(0, 0, W, H).fill('#14161C');
    doc.rect(0, 0, 6, H).fill('#C3F13D');
    doc.fillColor('#C3F13D').font('Helvetica-Bold').fontSize(11).text(d.gym.toUpperCase(), 16, 12, { width: 140 });
    doc.fillColor('#8C92A0').font('Helvetica').fontSize(6.5).text('CARNET DE MIEMBRO', 16, 26);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text(d.name, 16, 48, { width: 140 });
    doc.fillColor('#B8BCC8').font('Helvetica').fontSize(8).text(`ID ${d.code}`, 16, 66);
    if (d.plan) doc.fillColor('#C3F13D').font('Helvetica-Bold').fontSize(8).text(d.plan, 16, 80);
    doc.fillColor('#8C92A0').font('Helvetica').fontSize(7)
      .text(`Desde ${d.joinDate.toLocaleDateString('es-CO')}`, 16, 112)
      .text(d.expiresAt ? `Vence ${d.expiresAt.toLocaleDateString('es-CO')}` : '', 16, 122)
      .text(d.branch ?? '', 16, 132);
    doc.roundedRect(W - 96, 18, 82, 82, 6).fill('#FFFFFF');
    doc.image(qrPng, W - 90, 24, { width: 70, height: 70 });
    doc.fillColor('#8C92A0').fontSize(5.5).font('Helvetica').text('Escanea para ingresar', W - 96, 104, { width: 82, align: 'center' });
    doc.end();
  });
}
