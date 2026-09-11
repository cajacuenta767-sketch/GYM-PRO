import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

describe('GYM PRO API (e2e)', () => {
  let app: INestApplication;
  let http: request.Agent;
  const tokens: Record<string, string> = {};
  const login = async (email: string, password: string) => {
    const res = await http.post('/api/v1/auth/login').send({ email, password });
    return res.body;
  };
  const auth = (role: string) => ({ Authorization: `Bearer ${tokens[role]}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
    http = request(app.getHttpServer());
    tokens.admin = (await login('admin@gympro.app', 'admin123')).data.accessToken;
    tokens.accountant = (await login('contador@gympro.app', 'contador123')).data.accessToken;
    tokens.member = (await login('paola@gympro.app', 'miembro123')).data.accessToken;
  });

  afterAll(async () => { await app.close(); });

  describe('Autenticación', () => {
    it('rechaza credenciales incorrectas', async () => {
      const res = await http.post('/api/v1/auth/login').send({ email: 'admin@gympro.app', password: 'mala' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    it('devuelve perfil, permisos y rota el refresh token', async () => {
      const first = await login('recepcion@gympro.app', 'recepcion123');
      expect(first.data.user.role).toBe('STAFF');
      expect(Array.isArray(first.data.user.permissions)).toBe(true);
      const refreshed = await http.post('/api/v1/auth/refresh').send({ refreshToken: first.data.refreshToken });
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.accessToken).toBeDefined();
      const reused = await http.post('/api/v1/auth/refresh').send({ refreshToken: first.data.refreshToken });
      expect(reused.status).toBe(401);
    });
    it('exige token en rutas protegidas', async () => {
      expect((await http.get('/api/v1/members')).status).toBe(401);
    });
  });

  describe('Permisos', () => {
    it('un contador puede consultar pero no eliminar miembros', async () => {
      expect((await http.get('/api/v1/members?limit=1').set(auth('accountant'))).status).toBe(200);
      const res = await http.delete('/api/v1/members/inexistente').set(auth('accountant'));
      expect(res.status).toBe(403);
    });
    it('una cuenta de miembro solo accede al portal', async () => {
      expect((await http.get('/api/v1/members').set(auth('member'))).status).toBe(403);
      const home = await http.get('/api/v1/portal/home').set(auth('member'));
      expect(home.status).toBe(200);
      expect(home.body.data.member.code).toBe('M30824');
    });
  });

  describe('Miembros', () => {
    let memberId = '';
    it('crea, lista y consulta un miembro con código automático', async () => {
      const created = await http.post('/api/v1/members').set(auth('admin')).send({ firstName: 'Test', lastName: 'Integración', email: 'test.integracion@gympro.app', status: 'ACTIVE' });
      expect(created.status).toBe(201);
      expect(created.body.data.code).toMatch(/^M\d+$/);
      memberId = created.body.data.id;
      const list = await http.get('/api/v1/members?search=Integración').set(auth('admin'));
      expect(list.body.meta.total).toBeGreaterThanOrEqual(1);
      const detail = await http.get(`/api/v1/members/${memberId}`).set(auth('admin'));
      expect(detail.body.data.qrToken).toBeDefined();
    });
    it('registra entrada y salida por QR y deniega a un miembro vencido', async () => {
      const detail = await http.get(`/api/v1/members/${memberId}`).set(auth('admin'));
      const qr = detail.body.data.qrToken;
      const inRes = await http.post('/api/v1/attendance/check-in').set(auth('admin')).send({ qrToken: qr });
      expect(inRes.status).toBe(201);
      expect(inRes.body.data.action).toBe('CHECK_IN');
      const outRes = await http.post('/api/v1/attendance/check-in').set(auth('admin')).send({ qrToken: qr });
      expect(outRes.body.data.action).toBe('CHECK_OUT');
      await http.patch(`/api/v1/members/${memberId}`).set(auth('admin')).send({ status: 'EXPIRED' });
      const denied = await http.post('/api/v1/attendance/check-in').set(auth('admin')).send({ qrToken: qr });
      expect(denied.status).toBe(400);
      expect(denied.body.message).toMatch(/denegado/i);
    });
    it('crea una suscripción con pago y reactiva al miembro', async () => {
      const plans = await http.get('/api/v1/memberships').set(auth('admin'));
      const plan = plans.body.data[0];
      const sub = await http.post('/api/v1/subscriptions').set(auth('admin')).send({ memberId, planId: plan.id, registerPayment: true, paymentMethod: 'CASH' });
      expect(sub.status).toBe(201);
      expect(sub.body.data.status).toBe('ACTIVE');
      expect(sub.body.data.payments.length).toBe(1);
      const detail = await http.get(`/api/v1/members/${memberId}`).set(auth('admin'));
      expect(detail.body.data.status).toBe('ACTIVE');
      expect(detail.body.data.planId).toBe(plan.id);
    });
    it('congela la suscripción y bloquea el acceso', async () => {
      const subs = await http.get(`/api/v1/subscriptions?memberId=${memberId}&status=ACTIVE`).set(auth('admin'));
      const sub = subs.body.data[0];
      const frozen = await http.post(`/api/v1/subscriptions/${sub.id}/freeze`).set(auth('admin')).send({ days: 5, reason: 'Prueba' });
      expect(frozen.status).toBe(201);
      expect(new Date(frozen.body.data.endDate).getTime()).toBeGreaterThan(new Date(sub.endDate).getTime());
      const denied = await http.post('/api/v1/attendance/check-in').set(auth('admin')).send({ memberId });
      expect(denied.status).toBe(400);
      expect(denied.body.message).toMatch(/congelada/i);
    });
  });

  describe('Reservas', () => {
    it('llena una clase, deja en lista de espera y promueve al cancelar', async () => {
      const cls = await http.post('/api/v1/classes').set(auth('admin')).send({ name: 'Clase de prueba', capacity: 1, schedules: [{ dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }] });
      expect(cls.status).toBe(201);
      const classId = cls.body.data.id;
      const members = (await http.get('/api/v1/members?status=ACTIVE&limit=2').set(auth('admin'))).body.data;
      const date = new Date(Date.now() + 5 * 86_400_000).toISOString();
      const first = await http.post('/api/v1/bookings').set(auth('admin')).send({ memberId: members[0].id, classId, date });
      expect(first.body.data.status).toBe('CONFIRMED');
      const noWait = await http.post('/api/v1/bookings').set(auth('admin')).send({ memberId: members[1].id, classId, date });
      expect(noWait.status).toBe(400);
      const waited = await http.post('/api/v1/bookings').set(auth('admin')).send({ memberId: members[1].id, classId, date, waitlist: true });
      expect(waited.body.data.status).toBe('WAITLISTED');
      const pos = await http.get(`/api/v1/bookings/${waited.body.data.id}/waitlist-position`).set(auth('admin'));
      expect(pos.body.data.position).toBe(1);
      await http.post(`/api/v1/bookings/${first.body.data.id}/cancel`).set(auth('admin'));
      const promoted = await http.get(`/api/v1/bookings/${waited.body.data.id}`).set(auth('admin'));
      expect(promoted.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('Tienda', () => {
    it('registra una venta, descuenta stock y rechaza stock insuficiente', async () => {
      const products = (await http.get('/api/v1/store/products?limit=1').set(auth('admin'))).body.data;
      const product = products[0];
      const sale = await http.post('/api/v1/store/sales').set(auth('admin')).send({ items: [{ productId: product.id, quantity: 2 }], paymentMethod: 'CASH' });
      expect(sale.status).toBe(201);
      expect(sale.body.data.number).toMatch(/^VTA-/);
      const after = await http.get(`/api/v1/store/products/${product.id}`).set(auth('admin'));
      expect(after.body.data.stock).toBe(product.stock - 2);
      const tooMany = await http.post('/api/v1/store/sales').set(auth('admin')).send({ items: [{ productId: product.id, quantity: 100000 }] });
      expect(tooMany.status).toBe(400);
    });
  });

  describe('Pagos en línea', () => {
    it('crea un checkout de demostración y lo confirma activando la suscripción', async () => {
      const plans = (await http.get('/api/v1/portal/plans').set(auth('member'))).body.data;
      const checkout = await http.post('/api/v1/portal/checkout').set(auth('member')).send({ planId: plans[0].id });
      expect(checkout.status).toBe(201);
      expect(checkout.body.data.provider).toBe('MOCK');
      const confirm = await http.post('/api/v1/payments/checkout/confirm').set(auth('member')).send({ providerRef: checkout.body.data.providerRef });
      expect(confirm.status).toBe(200);
      expect(confirm.body.data.confirmed).toBe(true);
      expect(confirm.body.data.payment.status).toBe('PAID');
    });
    it('genera la factura en PDF', async () => {
      const payments = (await http.get('/api/v1/payments?limit=1').set(auth('admin'))).body.data;
      const res = await http.get(`/api/v1/payments/${payments[0].id}/invoice.pdf`).set(auth('admin'));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('Reportes y público', () => {
    it('devuelve el resumen ejecutivo', async () => {
      const res = await http.get('/api/v1/reports/summary').set(auth('admin'));
      expect(res.body.data.members).toBeGreaterThan(0);
      expect(res.body.data.retention).toBeGreaterThanOrEqual(0);
    });
    it('expone la información pública sin autenticación', async () => {
      const res = await http.get('/api/v1/public/info');
      expect(res.status).toBe(200);
      expect(res.body.data.plans.length).toBeGreaterThan(0);
      expect(res.body.data.schedule.length).toBe(7);
    });
    it('ejecuta la tarea diaria de notificaciones', async () => {
      const res = await http.post('/api/v1/notifications/run-daily').set(auth('admin'));
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('expiring');
    });
  });
});
