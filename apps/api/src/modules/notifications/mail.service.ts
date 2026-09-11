import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../database/prisma.service';

export interface MailMessage { to: string; subject: string; html: string; text?: string; template?: string }

/**
 * Envío de correo. Si hay SMTP configurado (env o ajustes) envía de verdad;
 * si no, guarda una vista previa en NotificationLog para poder revisarla desde el panel.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('Mail');
  private transporter: nodemailer.Transporter | null = null;
  private configuredFor = '';

  constructor(private prisma: PrismaService) {}

  private async transport() {
    const settings = Object.fromEntries((await this.prisma.setting.findMany({ where: { key: { in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom'] } } })).map((s) => [s.key, s.value]));
    const host = process.env.SMTP_HOST || settings.smtpHost;
    if (!host) return null;
    const signature = `${host}:${process.env.SMTP_PORT || settings.smtpPort}:${process.env.SMTP_USER || settings.smtpUser}`;
    if (!this.transporter || this.configuredFor !== signature) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || settings.smtpPort || 587),
        secure: Number(process.env.SMTP_PORT || settings.smtpPort || 587) === 465,
        auth: (process.env.SMTP_USER || settings.smtpUser) ? { user: process.env.SMTP_USER || settings.smtpUser, pass: process.env.SMTP_PASS || settings.smtpPass } : undefined,
      });
      this.configuredFor = signature;
    }
    return { transporter: this.transporter, from: process.env.SMTP_FROM || settings.smtpFrom || 'no-reply@gympro.app' };
  }

  async send(msg: MailMessage) {
    const t = await this.transport();
    if (!t) {
      await this.prisma.notificationLog.create({ data: { channel: 'EMAIL', template: msg.template, recipient: msg.to, subject: msg.subject, body: msg.html, status: 'PREVIEW' } });
      this.logger.log(`[vista previa] → ${msg.to} · ${msg.subject}`);
      return { status: 'PREVIEW' as const };
    }
    try {
      await t.transporter.sendMail({ from: t.from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
      await this.prisma.notificationLog.create({ data: { channel: 'EMAIL', template: msg.template, recipient: msg.to, subject: msg.subject, body: msg.html, status: 'SENT' } });
      return { status: 'SENT' as const };
    } catch (e: any) {
      await this.prisma.notificationLog.create({ data: { channel: 'EMAIL', template: msg.template, recipient: msg.to, subject: msg.subject, body: msg.html, status: 'FAILED', error: e.message } });
      this.logger.error(`Fallo al enviar a ${msg.to}: ${e.message}`);
      return { status: 'FAILED' as const, error: e.message };
    }
  }
}
