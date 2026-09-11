/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Aleatorio determinista para que la demo sea reproducible ──
let seed = 20240811;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const chance = (p: number) => rnd() < p;
const daysAgo = (n: number, h = 0, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d; };
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const FIRST_F = ['Paola', 'Cristina', 'Valentina', 'Camila', 'Laura', 'Mariana', 'Daniela', 'Sofía', 'Isabella', 'Gabriela', 'Natalia', 'Carolina', 'Andrea', 'Juliana', 'Alejandra', 'Manuela', 'Sara', 'Luciana', 'Antonia', 'Verónica', 'Ximena', 'Renata'];
const FIRST_M = ['Andrés', 'Juan', 'Carlos', 'Santiago', 'Mateo', 'Sebastián', 'Daniel', 'Felipe', 'Nicolás', 'Samuel', 'Alejandro', 'David', 'Julián', 'Esteban', 'Tomás', 'Emilio', 'Martín', 'Lucas', 'Diego', 'Pablo', 'Rafael', 'Simón'];
const LAST = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz', 'Castro', 'Vargas', 'Jiménez', 'Mendoza', 'Ruiz', 'Álvarez', 'Romero', 'Ospina', 'Mejía', 'Cardona', 'Restrepo', 'Zapata'];
const STREETS = ['Calle 24 C 38', 'Carrera 45 # 12-30', 'Av. El Poblado 18-22', 'Calle 10 # 43-15', 'Cra 70 # 45-10', 'Transversal 39 # 71-40', 'Calle 33 # 65-20', 'Cra 80 # 32-11', 'Calle 50 # 41-05', 'Cra 43A # 1-50'];
const INTERESTS = ['Pesas', 'Cardio', 'Yoga', 'CrossFit', 'Pérdida de peso', 'Tonificación', 'Resistencia', 'Flexibilidad', 'Baile', 'Fuerza'];

const activeOrAny = (ms: any[]) => { const a = ms.filter((m) => m.status === 'ACTIVE'); return a.length ? a : ms; };

async function main() {
  console.log('🧹 Limpiando base de datos...');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.accessLog.deleteMany(), prisma.message.deleteMany(), prisma.notification.deleteMany(), prisma.notificationLog.deleteMany(), prisma.refreshToken.deleteMany(),
    prisma.routineExercise.deleteMany(), prisma.routineDay.deleteMany(), prisma.routine.deleteMany(), prisma.membershipFreeze.deleteMany(),
    prisma.saleItem.deleteMany(), prisma.sale.deleteMany(), prisma.product.deleteMany(), prisma.productCategory.deleteMany(),
    prisma.eventRsvp.deleteMany(), prisma.event.deleteMany(), prisma.attendance.deleteMany(),
    prisma.payment.deleteMany(), prisma.subscription.deleteMany(), prisma.booking.deleteMany(),
    prisma.nutritionSchedule.deleteMany(), prisma.measurement.deleteMany(), prisma.memberClass.deleteMany(),
    prisma.classSchedule.deleteMany(), prisma.gymClass.deleteMany(), prisma.groupMember.deleteMany(), prisma.group.deleteMany(),
    prisma.exercise.deleteMany(), prisma.exerciseCategory.deleteMany(), prisma.membershipPlanActivity.deleteMany(),
    prisma.activity.deleteMany(), prisma.member.deleteMany(), prisma.membershipPlan.deleteMany(), prisma.staff.deleteMany(),
    prisma.newsletter.deleteMany(), prisma.notice.deleteMany(), prisma.setting.deleteMany(), prisma.user.deleteMany(), prisma.role.deleteMany(), prisma.branch.deleteMany(),
  ]);

  // ── Configuración ──
  console.log('⚙️  Configuración...');
  const settings: Record<string, [string, string]> = {
    gymName: ['GYM PRO', 'general'], slogan: ['Entrena. Supera. Repite.', 'general'], email: ['hola@gympro.app', 'general'],
    phone: ['+57 300 123 4567', 'general'], address: ['Calle 10 # 43-15', 'general'], city: ['Medellín, Colombia', 'general'],
    website: ['https://gympro.app', 'general'], timezone: ['America/Bogota', 'general'], language: ['es', 'general'],
    openingHours: ['Lun-Vie 05:00-22:00 · Sáb 06:00-18:00 · Dom 08:00-14:00', 'general'], logoUrl: ['', 'general'],
    currency: ['USD', 'billing'], currencySymbol: ['$', 'billing'], taxRate: ['0', 'billing'], invoicePrefix: ['FAC', 'billing'],
    stripeEnabled: ['false', 'billing'], stripePublicKey: ['', 'billing'], lateFee: ['5', 'billing'],
    notifyExpiring: ['true', 'notifications'], expiringDays: ['7', 'notifications'], notifyBirthday: ['true', 'notifications'],
    notifyNewMember: ['true', 'notifications'], smtpHost: ['', 'notifications'], smtpFrom: ['no-reply@gympro.app', 'notifications'],
    primaryColor: ['#B8E63C', 'appearance'], theme: ['system', 'appearance'], compactSidebar: ['false', 'appearance'],
    setupCompleted: ['true', 'general'], whatsappNumber: ['573001234567', 'notifications'], smtpPort: ['587', 'notifications'], smtpUser: ['', 'notifications'], smtpPass: ['', 'notifications'],
    qrCheckIn: ['true', 'access'], autoCheckOutMinutes: ['180', 'access'], allowExpiredGrace: ['true', 'access'], graceDays: ['3', 'access'],
  };
  await prisma.setting.createMany({ data: Object.entries(settings).map(([key, [value, group]]) => ({ key, value, group })) });

  // ── Roles y usuarios ──
  console.log('🔐 Roles y usuarios...');
  const all = (mods: string[], actions = ['read', 'write', 'delete']) => mods.flatMap((m) => actions.map((a) => `${m}.${a}`));
  const MODS = ['dashboard', 'memberships', 'groups', 'classes', 'bookings', 'nutrition', 'members', 'staff', 'activities', 'exercises', 'store', 'events', 'attendance', 'payments', 'messages', 'newsletters', 'notices', 'reports', 'subscriptions', 'settings', 'access'];
  const roleAdmin = await prisma.role.create({ data: { name: 'Administrador', description: 'Acceso total al sistema', permissions: JSON.stringify(all(MODS)), isSystem: true } });
  const roleReception = await prisma.role.create({ data: { name: 'Recepción', description: 'Atención al miembro, asistencia, reservas y ventas', permissions: JSON.stringify([...all(['dashboard', 'members', 'attendance', 'bookings', 'store', 'messages', 'notices', 'events'], ['read', 'write']), ...all(['memberships', 'classes', 'groups', 'staff', 'payments', 'subscriptions'], ['read'])]), isSystem: true } });
  const roleTrainer = await prisma.role.create({ data: { name: 'Entrenador', description: 'Clases, actividades, ejercicios y seguimiento de miembros', permissions: JSON.stringify([...all(['classes', 'activities', 'exercises', 'nutrition', 'bookings', 'messages'], ['read', 'write']), ...all(['dashboard', 'members', 'groups', 'attendance', 'events', 'notices'], ['read'])]), isSystem: true } });
  const roleAccountant = await prisma.role.create({ data: { name: 'Contabilidad', description: 'Pagos, suscripciones, tienda y reportes', permissions: JSON.stringify([...all(['payments', 'subscriptions', 'store', 'reports'], ['read', 'write']), ...all(['dashboard', 'members', 'memberships', 'messages'], ['read'])]), isSystem: true } });

  const pw = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await prisma.user.create({ data: { email: 'admin@gympro.app', password: pw('admin123'), name: 'Luis Barrera', role: 'ADMIN', roleId: roleAdmin.id, avatarUrl: 'https://i.pravatar.cc/200?img=12' } });
  const uReception = await prisma.user.create({ data: { email: 'recepcion@gympro.app', password: pw('recepcion123'), name: 'Juan Pérez', role: 'STAFF', roleId: roleReception.id, avatarUrl: 'https://i.pravatar.cc/200?img=53' } });
  const uTrainer = await prisma.user.create({ data: { email: 'nestor@gympro.app', password: pw('entrenador123'), name: 'Néstor Camelo', role: 'STAFF', roleId: roleTrainer.id, avatarUrl: 'https://i.pravatar.cc/200?img=59' } });
  const uAccountant = await prisma.user.create({ data: { email: 'contador@gympro.app', password: pw('contador123'), name: 'Mario Gómez', role: 'ACCOUNTANT', roleId: roleAccountant.id, avatarUrl: 'https://i.pravatar.cc/200?img=68' } });

  // ── Sedes ──
  console.log('🏢 Sedes...');
  const sedePrincipal = await prisma.branch.create({ data: { name: 'Sede Principal', address: 'Calle 10 # 43-15, El Poblado', phone: '+57 300 123 4567', email: 'poblado@gympro.app', color: '#22A6B3' } });
  const sedeNorte = await prisma.branch.create({ data: { name: 'Sede Norte', address: 'Cra 52 # 71-30, Bello', phone: '+57 300 765 4321', email: 'norte@gympro.app', color: '#7C5CFC' } });
  const branchFor = (i: number) => (i % 4 === 3 ? sedeNorte.id : sedePrincipal.id);

  // ── Equipo ──
  console.log('👥 Equipo...');
  const staffData = [
    { code: 'E0001', firstName: 'Néstor', lastName: 'Camelo', role: 'TRAINER', specialty: 'Fuerza y acondicionamiento', photo: 59, userId: uTrainer.id, salary: 1800, bio: 'Entrenador certificado NSCA con 8 años de experiencia en fuerza e hipertrofia.' },
    { code: 'E0002', firstName: 'Valentina', lastName: 'Ríos', role: 'TRAINER', specialty: 'Yoga y Pilates', photo: 47, salary: 1500, bio: 'Instructora RYT-500. Especialista en movilidad y respiración.' },
    { code: 'E0003', firstName: 'Andrés', lastName: 'Mejía', role: 'TRAINER', specialty: 'HIIT y CrossFit', photo: 33, salary: 1600, bio: 'Coach de CrossFit L2 y preparador físico.' },
    { code: 'E0004', firstName: 'Camila', lastName: 'Torres', role: 'TRAINER', specialty: 'Zumba y baile', photo: 44, salary: 1400, bio: 'Instructora ZIN y bailarina profesional.' },
    { code: 'E0005', firstName: 'Laura', lastName: 'Ospina', role: 'NUTRITIONIST', specialty: 'Nutrición deportiva', photo: 25, salary: 1700, bio: 'Nutricionista dietista, magíster en nutrición deportiva.' },
    { code: 'E0006', firstName: 'Juan', lastName: 'Pérez', role: 'RECEPTIONIST', specialty: 'Atención al cliente', photo: 53, userId: uReception.id, salary: 1100 },
    { code: 'E0007', firstName: 'Diana', lastName: 'Castro', role: 'MANAGER', specialty: 'Gerencia operativa', photo: 32, salary: 2400 },
    { code: 'E0008', firstName: 'Mario', lastName: 'Gómez', role: 'ACCOUNTANT', specialty: 'Contabilidad', photo: 68, userId: uAccountant.id, salary: 1600 },
    { code: 'E0009', firstName: 'Sebastián', lastName: 'Cardona', role: 'TRAINER', specialty: 'Spinning y cardio', photo: 15, salary: 1450, bio: 'Instructor de ciclismo indoor certificado Schwinn.' },
  ];
  const staff = [] as any[];
  for (const s of staffData) {
    const { photo, ...rest } = s;
    staff.push(await prisma.staff.create({ data: { ...rest, branchId: branchFor(staff.length), email: `${s.firstName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${s.lastName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@gympro.app`, phone: `+57 31${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`, photoUrl: `https://i.pravatar.cc/200?img=${photo}`, hireDate: daysAgo(between(120, 1400)) } }));
  }
  const trainers = staff.filter((s) => s.role === 'TRAINER');
  const nutritionist = staff.find((s) => s.role === 'NUTRITIONIST');

  // ── Actividades ──
  console.log('🏃 Actividades...');
  const activitiesData = [
    ['Acondicionamiento físico', 'Ejercicio', 0, 45, 380], ['Pesos libres', 'Fuerza', 0, 60, 420], ['Plancha', 'Core', 0, 20, 120],
    ['Crunch', 'Abdominales', 0, 20, 140], ['Pesas fijas', 'Fuerza', 0, 50, 380], ['Crunch resistido', 'Abdominales', 0, 20, 150],
    ['Hiperextensión', 'Espalda', 2, 25, 160], ['Curl de piernas', 'Piernas', 2, 30, 210], ['Curl de piernas invertido', 'Piernas', 2, 30, 210],
    ['Pull-in de pierna alta', 'Piernas', 2, 25, 180], ['Cardio en cinta', 'Cardio', 4, 40, 400], ['Ciclismo indoor', 'Cardio', 4, 45, 520],
    ['Yoga restaurativo', 'Flexibilidad', 1, 60, 200], ['Baile fitness', 'Cardio', 3, 50, 450],
  ] as const;
  const activities = [] as any[];
  for (const [name, category, t, durationMin, calories] of activitiesData) {
    activities.push(await prisma.activity.create({ data: { name, category, trainerId: trainers[t].id, durationMin, calories, description: `Sesión guiada de ${name.toLowerCase()} enfocada en ${category.toLowerCase()}.` } }));
  }

  // ── Planes de membresía ──
  console.log('💳 Membresías...');
  const plansData = [
    { name: 'Miembro Básico', durationDays: 30, price: 35, registrationFee: 5, installments: 1, color: '#94A3B8', description: 'Acceso a sala de máquinas y cardio en horario regular.', benefits: ['Sala de máquinas', 'Zona cardio', 'Casillero diario'], acts: [0, 1, 10] },
    { name: 'Miembro Oro', durationDays: 180, price: 180, registrationFee: 5, installments: 2, color: '#F5B700', description: 'Acceso completo más clases grupales ilimitadas.', benefits: ['Todo lo del plan Básico', 'Clases grupales ilimitadas', 'Valoración inicial', '1 invitado al mes'], acts: [0, 1, 2, 3, 4, 5, 10, 11] },
    { name: 'Miembro Diamante', durationDays: 300, price: 270, registrationFee: 5, installments: 3, color: '#22B8CF', description: 'Plan anual con seguimiento nutricional y entrenador asignado.', benefits: ['Todo lo del plan Oro', 'Plan nutricional', 'Entrenador asignado', 'Congelación 15 días'], acts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { name: 'Miembro VIP', durationDays: 360, price: 320, registrationFee: 0, installments: 4, color: '#B8E63C', description: 'Experiencia premium: acceso 24/7, toalla, parqueadero y todas las clases.', benefits: ['Todo lo del plan Diamante', 'Acceso 24/7', 'Toalla y parqueadero', 'Sesiones personalizadas mensuales', 'Congelación 30 días'], acts: activitiesData.map((_, i) => i) },
  ];
  const plans = [] as any[];
  for (const p of plansData) {
    const { acts, benefits, ...rest } = p;
    plans.push(await prisma.membershipPlan.create({ data: { ...rest, benefits: JSON.stringify(benefits), activities: { create: acts.map((i) => ({ activityId: activities[i].id })) } } }));
  }

  // ── Categorías y ejercicios ──
  console.log('🏋️  Ejercicios...');
  const catData = [['Abdominales', 'Core'], ['Bíceps', 'Brazos'], ['Piernas', 'Tren inferior'], ['Pecho', 'Tren superior'], ['Espalda', 'Tren superior'], ['Hombros', 'Tren superior'], ['Cardio', 'Resistencia']];
  const cats: any[] = [];
  for (const [name, muscleGroup] of catData) cats.push(await prisma.exerciseCategory.create({ data: { name, muscleGroup, description: `Ejercicios de gimnasio total para ${name.toLowerCase()}.` } }));
  const exData = [
    ['Crunch', 0, 'BEGINNER', 3, 15, 45, 'Colchoneta'], ['Crunch resistido', 0, 'INTERMEDIATE', 4, 12, 60, 'Polea'], ['Plancha frontal', 0, 'BEGINNER', 3, 1, 60, 'Colchoneta'], ['Elevación de piernas', 0, 'INTERMEDIATE', 3, 12, 60, 'Banco'],
    ['Curl con barra', 1, 'INTERMEDIATE', 4, 10, 90, 'Barra Z'], ['Curl martillo', 1, 'BEGINNER', 3, 12, 60, 'Mancuernas'], ['Curl concentrado', 1, 'INTERMEDIATE', 3, 12, 60, 'Mancuerna'],
    ['Sentadilla', 2, 'INTERMEDIATE', 4, 10, 120, 'Barra'], ['Curl de piernas', 2, 'BEGINNER', 3, 12, 60, 'Máquina'], ['Curl de piernas invertido', 2, 'INTERMEDIATE', 3, 12, 60, 'Máquina'], ['Prensa de piernas', 2, 'BEGINNER', 4, 12, 90, 'Máquina'], ['Peso muerto rumano', 2, 'ADVANCED', 4, 8, 120, 'Barra'],
    ['Press de banca', 3, 'INTERMEDIATE', 4, 8, 120, 'Barra'], ['Aperturas con mancuernas', 3, 'BEGINNER', 3, 12, 60, 'Mancuernas'],
    ['Hiperextensión', 4, 'BEGINNER', 3, 15, 60, 'Banco romano'], ['Remo con barra', 4, 'INTERMEDIATE', 4, 10, 90, 'Barra'], ['Dominadas', 4, 'ADVANCED', 4, 8, 120, 'Barra fija'],
    ['Press militar', 5, 'INTERMEDIATE', 4, 10, 90, 'Barra'], ['Elevaciones laterales', 5, 'BEGINNER', 3, 15, 45, 'Mancuernas'],
    ['Cinta inclinada', 6, 'BEGINNER', 1, 30, 0, 'Cinta'], ['Burpees', 6, 'ADVANCED', 5, 15, 45, 'Peso corporal'],
  ] as const;
  for (const [name, c, difficulty, sets, reps, restSeconds, equipment] of exData) {
    await prisma.exercise.create({ data: { name, categoryId: cats[c].id, difficulty, sets, reps, restSeconds, equipment, description: `Ejecuta ${name.toLowerCase()} con técnica controlada, manteniendo el core activo durante todo el movimiento.` } });
  }

  // ── Grupos ──
  console.log('🧑‍🤝‍🧑 Grupos...');
  const groupsData = [['Zumba', '#FF7A59', 'Baile y cardio con ritmos latinos'], ['Atletas', '#22B8CF', 'Preparación física para competencias'], ['Fuerza', '#7C5CFC', 'Hipertrofia y powerlifting'], ['Cardiovascular', '#F5B700', 'Resistencia y salud cardiovascular'], ['Yoga & Pilates', '#2DD4BF', 'Movilidad, flexibilidad y control'], ['Adultos mayores', '#94A3B8', 'Entrenamiento funcional de bajo impacto']];
  const groups: any[] = [];
  for (const [name, color, description] of groupsData) groups.push(await prisma.group.create({ data: { name, color, description } }));

  // ── Clases y horarios ──
  console.log('📅 Clases...');
  const classesData = [
    { name: 'Clase de Yoga', trainer: 1, location: 'Sala 2 · Mente y cuerpo', capacity: 18, fee: 5, color: '#2DD4BF', schedules: [[1, '08:00', '10:00'], [3, '08:00', '10:00'], [5, '08:00', '10:00']] },
    { name: 'Clase de Aeróbicos', trainer: 3, location: 'Sala principal', capacity: 25, fee: 5, color: '#FF7A59', schedules: [[2, '18:00', '20:00'], [4, '18:00', '20:00']] },
    { name: 'Clase de HIIT', trainer: 0, location: 'Zona funcional', capacity: 16, fee: 5, color: '#EF4444', schedules: [[1, '18:30', '19:45'], [3, '18:30', '19:45'], [5, '18:30', '19:45']] },
    { name: 'Cardio Class', trainer: 4, location: 'Zona cardio', capacity: 20, fee: 5, color: '#F5B700', schedules: [[5, '15:30', '16:30'], [6, '15:30', '16:30']] },
    { name: 'Pilates', trainer: 1, location: 'Sala 2 · Mente y cuerpo', capacity: 14, fee: 5, color: '#7C5CFC', schedules: [[2, '12:00', '13:15'], [4, '12:00', '13:15']] },
    { name: 'Zumba Class', trainer: 3, location: 'Sala principal', capacity: 30, fee: 5, color: '#EC4899', schedules: [[6, '20:30', '22:30'], [2, '20:30', '21:30']] },
    { name: 'Power Yoga Class', trainer: 1, location: 'Sala 2 · Mente y cuerpo', capacity: 16, fee: 6, color: '#22B8CF', schedules: [[1, '09:15', '11:45'], [3, '09:15', '11:45'], [4, '09:15', '11:45'], [5, '09:15', '11:45'], [6, '09:15', '11:45']] },
    { name: 'Spinning', trainer: 4, location: 'Sala de ciclismo', capacity: 22, fee: 5, color: '#0EA5E9', schedules: [[1, '06:00', '07:00'], [2, '06:00', '07:00'], [3, '06:00', '07:00'], [4, '06:00', '07:00'], [5, '06:00', '07:00']] },
    { name: 'CrossFit WOD', trainer: 0, location: 'Box CrossFit', capacity: 12, fee: 8, color: '#B8E63C', schedules: [[1, '07:00', '08:00'], [2, '19:00', '20:00'], [4, '19:00', '20:00'], [6, '10:00', '11:00']] },
  ];
  const classes: any[] = [];
  for (const c of classesData) {
    classes.push(await prisma.gymClass.create({
      data: { name: c.name, branchId: classes.length % 3 === 2 ? sedeNorte.id : sedePrincipal.id, trainerId: trainers[c.trainer].id, location: c.location, capacity: c.capacity, bookingFee: c.fee, color: c.color, description: `Clase grupal de ${c.name.replace('Clase de ', '').replace(' Class', '').toLowerCase()} dirigida por instructor certificado.`, schedules: { create: c.schedules.map(([dayOfWeek, startTime, endTime]) => ({ dayOfWeek: dayOfWeek as number, startTime: startTime as string, endTime: endTime as string })) } },
      include: { schedules: true },
    }));
  }

  // ── Miembros ──
  console.log('🪪 Miembros...');
  const members: any[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < 48; i++) {
    const gender = chance(0.52) ? 'FEMENINO' : 'MASCULINO';
    let firstName = '', lastName = '';
    do { firstName = gender === 'FEMENINO' ? pick(FIRST_F) : pick(FIRST_M); lastName = `${pick(LAST)} ${pick(LAST)}`; } while (usedNames.has(firstName + lastName));
    usedNames.add(firstName + lastName);
    const joinDaysAgo = i < 9 ? between(0, 10) : i < 14 ? between(30, 55) : between(56, 640);
    const joinDate = daysAgo(joinDaysAgo, between(7, 20));
    const plan = pick([plans[0], plans[0], plans[0], plans[1], plans[1], plans[2], plans[3]]);
    // Estado según última suscripción (se corrige después)
    const photoId = gender === 'FEMENINO' ? pick([1, 5, 9, 10, 16, 20, 23, 24, 26, 27, 29, 31, 32, 35, 38, 40, 41, 43, 44, 45, 47, 48, 49]) : pick([3, 6, 7, 8, 11, 12, 13, 14, 15, 17, 18, 33, 50, 51, 52, 54, 55, 56, 57, 58, 60, 61, 62]);
    const year = between(1968, 2006);
    const birthDate = new Date(year, between(0, 11), between(1, 28));
    const member = await prisma.member.create({
      data: {
        code: `M${30824 + i}`, firstName, lastName, gender, birthDate, branchId: branchFor(i),
        email: `${firstName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}.${lastName.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}${i}@gmail.com`,
        phone: `+57 3${between(0, 2)}${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
        address: pick(STREETS), photoUrl: `https://i.pravatar.cc/200?img=${photoId}`,
        username: `${firstName.toLowerCase()}${between(1, 99)}`,
        planId: plan.id, trainerId: chance(0.8) ? pick(trainers).id : null,
        interestArea: pick(INTERESTS), joinDate, status: 'ACTIVE',
        emergencyContact: `${pick([...FIRST_F, ...FIRST_M])} ${pick(LAST)} · +57 31${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
        groups: { create: [...new Set([pick(groups).id, ...(chance(0.4) ? [pick(groups).id] : [])])].map((groupId) => ({ groupId })) },
        classes: { create: [...new Set(Array.from({ length: between(1, 4) }, () => pick(classes).id))].map((classId) => ({ classId })) },
      },
    });
    members.push({ ...member, plan });
  }
  // Paola: la miembro de ejemplo del original (liberar primero el código M30824)
  await prisma.member.update({ where: { id: members[0].id }, data: { code: 'M30872' } });
  const paola = await prisma.member.update({
    where: { id: members[7].id },
    data: { firstName: 'Paola', lastName: 'Restrepo Vélez', code: 'M30824', email: 'paola@gmail.com', address: 'Calle 24 C 38', birthDate: new Date(2001, 7, 1), gender: 'FEMENINO', username: 'paola', interestArea: 'Pesas', trainerId: trainers[0].id, planId: plans[3].id, photoUrl: 'https://i.pravatar.cc/200?img=47' },
  });
  members[7] = { ...paola, plan: plans[3] };

  // ── Suscripciones y pagos ──
  console.log('🧾 Suscripciones y pagos...');
  let invoice = 1;
  const now = new Date();
  for (const m of members) {
    let cursor = startOfDay(m.joinDate);
    let planCursor = m.plan;
    let lastStatus = 'ACTIVE';
    let lastEnd = cursor;
    let guard = 0;
    while (cursor <= now && guard++ < 8) {
      const end = addDays(cursor, planCursor.durationDays);
      const isCurrent = end >= now;
      // ¿Renueva? (los actuales siempre; los históricos con 85 %)
      const status = isCurrent ? 'ACTIVE' : 'EXPIRED';
      const sub = await prisma.subscription.create({ data: { memberId: m.id, planId: planCursor.id, startDate: cursor, endDate: end, price: planCursor.price, status } });
      const paid = isCurrent ? chance(0.9) : true;
      await prisma.payment.create({
        data: {
          invoiceNumber: `FAC-${cursor.getFullYear()}-${String(invoice++).padStart(6, '0')}`, memberId: m.id, subscriptionId: sub.id,
          concept: `Membresía ${planCursor.name}`, amount: planCursor.price + (guard === 1 ? planCursor.registrationFee : 0),
          method: pick(['CASH', 'CARD', 'CARD', 'TRANSFER', 'STRIPE']), status: paid ? 'PAID' : 'PENDING',
          paidAt: addDays(cursor, between(0, 2)), dueDate: paid ? null : addDays(cursor, 10), reference: chance(0.5) ? `REF-${between(100000, 999999)}` : null,
        },
      });
      lastStatus = status; lastEnd = end;
      if (!isCurrent) {
        if (!chance(0.85)) break; // no renovó
        cursor = addDays(end, between(0, 6));
        planCursor = chance(0.25) ? pick(plans) : planCursor;
      } else break;
    }
    const expired = lastStatus === 'EXPIRED';
    const finalStatus = expired ? (chance(0.7) ? 'EXPIRED' : 'INACTIVE') : chance(0.04) ? 'SUSPENDED' : 'ACTIVE';
    await prisma.member.update({ where: { id: m.id }, data: { status: finalStatus, expiresAt: lastEnd, planId: planCursor.id } });
    m.status = finalStatus; m.expiresAt = lastEnd;
  }
  // Cobros recientes del mes en curso: renovaciones anticipadas, clases y eventos
  const extras: [string, number][] = [['Renovación anticipada · 10 % dto.', 0.9], ['Clases sueltas (5)', 25], ['Inscripción · Carrera 5K', 10], ['Sesión personalizada', 20], ['Congelación de membresía', 5]];
  for (let i = 0; i < 16; i++) {
    const m = pick(activeOrAny(members));
    const [concept, price] = pick(extras);
    const amount = price < 1 ? Math.round((m.plan?.price ?? 35) * price) : price;
    await prisma.payment.create({ data: { invoiceNumber: `FAC-${now.getFullYear()}-${String(invoice++).padStart(6, '0')}`, memberId: m.id, concept, amount, method: pick(['CASH', 'CARD', 'TRANSFER', 'STRIPE']), status: chance(0.85) ? 'PAID' : 'PENDING', paidAt: daysAgo(between(0, Math.min(10, now.getDate() - 1)), between(7, 20), between(0, 59)) } });
  }
  // Algunos vencen en los próximos días (para el tablero)
  for (const idx of [2, 5, 9, 14, 21]) {
    await prisma.member.update({ where: { id: members[idx].id }, data: { status: 'ACTIVE', expiresAt: addDays(now, between(1, 7)) } });
    members[idx].status = 'ACTIVE';
  }

  // ── Asistencia y registros de acceso ──
  console.log('🚪 Asistencia...');
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const attendanceRows: any[] = [];
  const accessRows: any[] = [];
  for (let d = 45; d >= 0; d--) {
    const day = daysAgo(d);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    for (const m of activeMembers) {
      const joined = startOfDay(m.joinDate) <= day;
      if (!joined || !chance(weekend ? 0.22 : 0.48)) continue;
      const hour = pick([6, 6, 7, 7, 8, 9, 12, 13, 17, 18, 18, 19, 19, 20, 21]);
      const checkIn = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, between(0, 59));
      if (checkIn > now) continue;
      const stay = between(45, 130);
      const checkOut = new Date(checkIn.getTime() + stay * 60000);
      const method = pick(['QR', 'QR', 'QR', 'MANUAL', 'CARD']);
      attendanceRows.push({ memberId: m.id, checkIn, checkOut: d === 0 && checkOut > now ? null : checkOut, method });
      accessRows.push({ memberId: m.id, method, allowed: true, gate: 'Entrada principal', at: checkIn });
    }
  }
  await prisma.attendance.createMany({ data: attendanceRows });
  // Accesos denegados
  for (const m of members.filter((x) => x.status !== 'ACTIVE').slice(0, 8)) {
    accessRows.push({ memberId: m.id, method: 'QR', allowed: false, reason: m.status === 'EXPIRED' ? 'Membresía vencida' : `Miembro ${m.status}`, gate: 'Entrada principal', at: daysAgo(between(0, 12), between(7, 20), between(0, 59)) });
  }
  await prisma.accessLog.createMany({ data: accessRows });

  // ── Reservas ──
  console.log('🎟️  Reservas...');
  const bookingRows: any[] = [];
  for (let d = -14; d <= 7; d++) {
    const day = addDays(startOfDay(now), d);
    for (const c of classes) {
      const sched = c.schedules.find((s: any) => s.dayOfWeek === day.getDay());
      if (!sched) continue;
      const n = between(2, Math.min(9, c.capacity - 2));
      const chosen = new Set<string>();
      for (let i = 0; i < n; i++) {
        const m = pick(activeMembers);
        if (chosen.has(m.id)) continue;
        chosen.add(m.id);
        const [h, mi] = sched.startTime.split(':').map(Number);
        const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi);
        const past = date < now;
        bookingRows.push({ memberId: m.id, classId: c.id, scheduleId: sched.id, date, status: past ? pick(['ATTENDED', 'ATTENDED', 'ATTENDED', 'NO_SHOW', 'CANCELLED']) : 'CONFIRMED', paid: chance(0.8), amount: c.bookingFee });
      }
    }
  }
  await prisma.booking.createMany({ data: bookingRows });

  // ── Mediciones ──
  console.log('📏 Mediciones...');
  for (const m of [members[7], ...activeMembers.slice(0, 14)]) {
    let weight = m.gender === 'FEMENINO' ? between(55, 78) : between(68, 96);
    let waist = m.gender === 'FEMENINO' ? between(66, 88) : between(78, 102);
    for (let k = 6; k >= 0; k--) {
      await prisma.measurement.create({ data: { memberId: m.id, type: 'WEIGHT', value: weight, unit: 'kg', measuredAt: daysAgo(k * 28 + between(0, 3)) } });
      await prisma.measurement.create({ data: { memberId: m.id, type: 'WAIST', value: waist, unit: 'cm', measuredAt: daysAgo(k * 28 + between(0, 3)) } });
      weight = Math.round((weight - rnd() * 1.4 + 0.3) * 10) / 10;
      waist = Math.round((waist - rnd() * 1.2 + 0.2) * 10) / 10;
    }
    await prisma.measurement.create({ data: { memberId: m.id, type: 'HEIGHT', value: m.gender === 'FEMENINO' ? between(155, 172) : between(166, 186), unit: 'cm', measuredAt: m.joinDate } });
    await prisma.measurement.create({ data: { memberId: m.id, type: 'BODY_FAT', value: between(14, 30), unit: '%', measuredAt: daysAgo(between(0, 20)) } });
  }

  // ── Nutrición ──
  console.log('🥗 Nutrición...');
  const meals: Record<string, string[]> = {
    BREAKFAST: ['Avena con frutos rojos y claras', 'Tostadas integrales con aguacate y huevo', 'Yogur griego con granola y banano', 'Arepa integral con queso bajo en grasa'],
    SNACK_AM: ['Manzana y almendras', 'Batido de proteína con fresa', 'Galletas de arroz con mantequilla de maní'],
    LUNCH: ['Pechuga a la plancha, arroz integral y ensalada', 'Salmón al horno con quinoa y brócoli', 'Lentejas con vegetales y plátano', 'Pasta integral con pollo y verduras'],
    SNACK_PM: ['Yogur natural con nueces', 'Huevos cocidos y zanahoria', 'Barra de proteína'],
    DINNER: ['Tortilla de vegetales con ensalada', 'Pescado al vapor con verduras', 'Crema de calabaza y pollo desmenuzado', 'Wrap integral de atún'],
  };
  const kcal: Record<string, [number, number]> = { BREAKFAST: [350, 480], SNACK_AM: [120, 220], LUNCH: [520, 700], SNACK_PM: [130, 220], DINNER: [380, 520] };
  for (const m of [members[7], activeMembers[3], activeMembers[10]]) {
    for (let day = 0; day < 7; day++) {
      for (const mealType of Object.keys(meals)) {
        const calories = between(...kcal[mealType]);
        await prisma.nutritionSchedule.create({ data: { memberId: m.id, nutritionistId: nutritionist.id, dayOfWeek: day, mealType, description: pick(meals[mealType]), calories, protein: Math.round(calories * 0.3 / 4), carbs: Math.round(calories * 0.45 / 4), fats: Math.round(calories * 0.25 / 9) } });
      }
    }
  }

  // ── Tienda ──
  console.log('🛒 Tienda...');
  const pcats: any = {};
  for (const n of ['Suplementos', 'Bebidas', 'Ropa', 'Accesorios']) pcats[n] = await prisma.productCategory.create({ data: { name: n } });
  const productsData = [
    ['Proteína Whey 2 lb · Vainilla', 'Suplementos', 45, 30, 24], ['Proteína Whey 2 lb · Chocolate', 'Suplementos', 45, 30, 18], ['Creatina monohidrato 300 g', 'Suplementos', 28, 17, 31], ['Pre-entreno 30 servicios', 'Suplementos', 32, 20, 9],
    ['Agua 600 ml', 'Bebidas', 1, 0.4, 120], ['Bebida isotónica 500 ml', 'Bebidas', 2.5, 1.2, 64], ['Batido proteico listo', 'Bebidas', 4, 2.2, 4],
    ['Camiseta GYM PRO', 'Ropa', 18, 8, 26], ['Licra deportiva', 'Ropa', 25, 12, 3], ['Gorra GYM PRO', 'Ropa', 12, 5, 15],
    ['Guantes de entrenamiento', 'Accesorios', 15, 7, 11], ['Termo 1 L', 'Accesorios', 14, 6, 20], ['Toalla microfibra', 'Accesorios', 9, 4, 2], ['Straps para levantamiento', 'Accesorios', 11, 5, 8],
  ] as const;
  const products: any[] = [];
  let sku = 1001;
  for (const [name, cat, price, cost, stock] of productsData) products.push(await prisma.product.create({ data: { name, sku: `GP-${sku++}`, categoryId: pcats[cat].id, price, cost, stock, minStock: 5 } }));
  let saleNo = 1;
  for (let i = 0; i < 70; i++) {
    const createdAt = daysAgo(between(0, 95), between(6, 21), between(0, 59));
    const nItems = between(1, 3);
    const items: any[] = [];
    let subtotal = 0;
    for (let k = 0; k < nItems; k++) {
      const p = pick(products); const quantity = between(1, 3); const total = p.price * quantity; subtotal += total;
      items.push({ productId: p.id, quantity, unitPrice: p.price, total });
    }
    await prisma.sale.create({ data: { number: `VTA-${createdAt.getFullYear()}-${String(saleNo++).padStart(6, '0')}`, memberId: chance(0.8) ? pick(members).id : null, staffId: staff[5].id, subtotal, discount: 0, tax: 0, total: subtotal, paymentMethod: pick(['CASH', 'CASH', 'CARD', 'TRANSFER']), createdAt, items: { create: items } } });
  }

  // ── Eventos ──
  console.log('🎉 Eventos...');
  const eventsData = [
    ['Carrera 5K GYM PRO', 'COMPETITION', 13, '13:30', 'Parque Lleras', 80, 10, '#22B8CF', 'Carrera recreativa abierta a miembros e invitados. Incluye camiseta e hidratación.'],
    ['Taller de nutrición deportiva', 'WORKSHOP', 6, '18:00', 'Sala de conferencias', 30, 0, '#2DD4BF', 'Laura Ospina explica cómo planificar la alimentación alrededor del entrenamiento.'],
    ['Reto de fuerza · Deadlift', 'COMPETITION', 20, '10:00', 'Box CrossFit', 24, 5, '#7C5CFC', 'Competencia interna de peso muerto por categorías.'],
    ['Masterclass de Zumba', 'EVENT', 2, '19:00', 'Sala principal', 60, 0, '#EC4899', 'Dos horas de baile con instructores invitados.'],
    ['Mantenimiento de equipos', 'HOLIDAY', 27, '06:00', 'Sala de máquinas', null, 0, '#94A3B8', 'La sala de máquinas permanecerá cerrada hasta las 14:00.'],
    ['Jornada de valoración física', 'WORKSHOP', -9, '08:00', 'Consultorio', 40, 0, '#F5B700', 'Toma de medidas, porcentaje de grasa y evaluación postural gratuita.'],
    ['Open Day · Trae un amigo', 'EVENT', -22, '09:00', 'Todo el gimnasio', 150, 0, '#FF7A59', 'Jornada de puertas abiertas con clases gratuitas.'],
  ] as const;
  for (const [title, type, dOffset, time, location, capacity, fee, color, description] of eventsData) {
    const [h, mi] = time.split(':').map(Number);
    const base = addDays(startOfDay(now), dOffset);
    const startsAt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mi);
    const ev = await prisma.event.create({ data: { title, type, startsAt, endsAt: new Date(startsAt.getTime() + between(2, 5) * 3600000), location, capacity: capacity ?? undefined, fee, color, description } });
    const rsvps = new Set<string>();
    for (let i = 0; i < between(4, 18); i++) rsvps.add(pick(activeMembers).id);
    await prisma.eventRsvp.createMany({ data: [...rsvps].map((memberId) => ({ eventId: ev.id, memberId, status: pick(['GOING', 'GOING', 'MAYBE']) })) });
  }

  // ── Mensajes ──
  console.log('✉️  Mensajes...');
  const users = [admin, uReception, uTrainer, uAccountant];
  const msgs = [
    [uReception, admin, 'Solicitud de congelación · Paola Restrepo', 'Paola pide congelar su membresía VIP 15 días por viaje. ¿Autorizas? Tiene el beneficio disponible.'],
    [uTrainer, admin, 'Nuevo horario de CrossFit', 'Propongo abrir un WOD adicional los sábados a las 8:00, la clase de las 10:00 se llena en minutos.'],
    [uAccountant, admin, 'Cierre contable de agosto', 'Adjunto el resumen: ingresos por membresías subieron 12 % respecto a julio. Quedan 6 pagos pendientes por cobrar.'],
    [admin, uReception, 'Campaña de renovación', 'Por favor contacta a los miembros que vencen esta semana y ofréceles el 10 % de descuento por renovación anticipada.'],
    [admin, uTrainer, 'Valoraciones físicas', 'Recuerda agendar las valoraciones de los nuevos miembros de este mes antes del viernes.'],
    [uTrainer, uReception, 'Inscripción a Power Yoga', 'Cristina quedó inscrita en Power Yoga a partir del lunes. Gracias por gestionar el cupo.'],
    [uReception, uAccountant, 'Pago por transferencia', 'Sebastián Cardona pagó su membresía por transferencia, referencia REF-554120. ¿Puedes confirmarla?'],
    [uAccountant, uReception, 'Confirmado', 'Transferencia verificada en banco. Ya quedó marcada como pagada en el sistema.'],
    [admin, uAccountant, 'Presupuesto de equipos', 'Necesito la proyección de flujo de caja para evaluar la compra de 4 bicicletas nuevas de spinning.'],
    [uReception, admin, 'Reporte de acceso denegado', 'Hoy se negó el acceso a 3 miembros con membresía vencida. Dos renovaron en el momento.'],
  ] as const;
  let mi = 0;
  for (const [from, to, subject, body] of msgs) {
    const createdAt = daysAgo(between(0, 20), between(7, 20), between(0, 59));
    await prisma.message.create({ data: { senderId: (from as any).id, recipientId: (to as any).id, subject, body, createdAt, readAt: mi++ < 6 && chance(0.6) ? new Date(createdAt.getTime() + 3600000) : null } });
  }

  // ── Cuentas del portal para miembros ──
  console.log('📱 Cuentas del portal...');
  const portalMembers = [members[7], activeMembers[3], activeMembers[10], activeMembers[15]];
  const portalUsers: any[] = [];
  for (const [i, m] of portalMembers.entries()) {
    const email = i === 0 ? 'paola@gympro.app' : `${m.firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${m.lastName.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@gympro.app`;
    const u = await prisma.user.create({ data: { email, password: pw('miembro123'), name: `${m.firstName} ${m.lastName}`, role: 'MEMBER', avatarUrl: m.photoUrl } });
    await prisma.member.update({ where: { id: m.id }, data: { userId: u.id, email } });
    portalUsers.push({ user: u, member: m });
  }

  // ── Rutinas ──
  console.log('📋 Rutinas...');
  const exs = await prisma.exercise.findMany({ include: { category: true } });
  const byCat = (name: string) => exs.filter((e) => e.category?.name === name);
  const dayOf = (dayOfWeek: number, title: string, list: { e: any; sets?: number; reps?: string; rest?: number; weight?: string }[]) => ({ dayOfWeek, title, exercises: { create: list.filter((x) => x.e).map((x, j) => ({ exerciseId: x.e.id, order: j, sets: x.sets ?? 3, reps: x.reps ?? '12', restSeconds: x.rest ?? 60, weight: x.weight })) } });
  const fullBody = await prisma.routine.create({ data: { name: 'Full body 3 días · Principiante', description: 'Rutina de cuerpo completo para adaptación, 3 sesiones por semana.', goal: 'GENERAL', level: 'BEGINNER', weeks: 6, isTemplate: true, trainerId: trainers[0].id,
    days: { create: [
      dayOf(1, 'Cuerpo completo A', [{ e: byCat('Piernas')[0], sets: 3, reps: '12' }, { e: byCat('Pecho')[1], sets: 3, reps: '12' }, { e: byCat('Espalda')[0], sets: 3, reps: '15' }, { e: byCat('Abdominales')[0], sets: 3, reps: '15' }]),
      dayOf(3, 'Cuerpo completo B', [{ e: byCat('Piernas')[3], sets: 3, reps: '12' }, { e: byCat('Hombros')[1], sets: 3, reps: '15' }, { e: byCat('Bíceps')[1], sets: 3, reps: '12' }, { e: byCat('Abdominales')[2], sets: 3, reps: '45 s' }]),
      dayOf(5, 'Cuerpo completo C', [{ e: byCat('Piernas')[1], sets: 3, reps: '12' }, { e: byCat('Pecho')[0], sets: 3, reps: '10' }, { e: byCat('Espalda')[1], sets: 3, reps: '10' }, { e: byCat('Cardio')[0], sets: 1, reps: '20 min' }]),
    ] } } });
  const ppl = await prisma.routine.create({ data: { name: 'Empuje · Tirón · Pierna', description: 'Hipertrofia intermedia, 6 días con descanso el domingo.', goal: 'HYPERTROPHY', level: 'INTERMEDIATE', weeks: 8, isTemplate: true, trainerId: trainers[0].id,
    days: { create: [
      dayOf(1, 'Empuje', [{ e: byCat('Pecho')[0], sets: 4, reps: '8', rest: 120, weight: '60 kg' }, { e: byCat('Hombros')[0], sets: 4, reps: '10', rest: 90 }, { e: byCat('Pecho')[1], sets: 3, reps: '12' }, { e: byCat('Hombros')[1], sets: 3, reps: '15', rest: 45 }]),
      dayOf(2, 'Tirón', [{ e: byCat('Espalda')[2], sets: 4, reps: '6-8', rest: 120 }, { e: byCat('Espalda')[1], sets: 4, reps: '10', rest: 90 }, { e: byCat('Bíceps')[0], sets: 3, reps: '10' }, { e: byCat('Bíceps')[2], sets: 3, reps: '12' }]),
      dayOf(3, 'Pierna', [{ e: byCat('Piernas')[0], sets: 4, reps: '8', rest: 150, weight: '80 kg' }, { e: byCat('Piernas')[4], sets: 4, reps: '8', rest: 120 }, { e: byCat('Piernas')[1], sets: 3, reps: '12' }, { e: byCat('Abdominales')[1], sets: 3, reps: '15' }]),
      dayOf(4, 'Empuje', [{ e: byCat('Pecho')[0], sets: 4, reps: '10', rest: 90 }, { e: byCat('Hombros')[0], sets: 3, reps: '12' }, { e: byCat('Pecho')[1], sets: 3, reps: '15' }]),
      dayOf(5, 'Tirón', [{ e: byCat('Espalda')[1], sets: 4, reps: '10' }, { e: byCat('Espalda')[0], sets: 3, reps: '15' }, { e: byCat('Bíceps')[1], sets: 3, reps: '12' }]),
      dayOf(6, 'Pierna', [{ e: byCat('Piernas')[3], sets: 4, reps: '12' }, { e: byCat('Piernas')[2], sets: 3, reps: '12' }, { e: byCat('Cardio')[1], sets: 4, reps: '15', rest: 45 }]),
    ] } } });
  // Asignada a Paola y a dos miembros más
  for (const [i, m] of [members[7], activeMembers[3], activeMembers[10]].entries()) {
    const src = i === 0 ? ppl : fullBody;
    const full = await prisma.routine.findUniqueOrThrow({ where: { id: src.id }, include: { days: { include: { exercises: true } } } });
    await prisma.routine.create({ data: { name: full.name, description: full.description, goal: full.goal, level: full.level, weeks: full.weeks, isTemplate: false, memberId: m.id, trainerId: full.trainerId, startDate: daysAgo(between(3, 20)),
      days: { create: full.days.map((d, k) => ({ dayOfWeek: d.dayOfWeek, title: d.title, order: k, exercises: { create: d.exercises.map((e, j) => ({ exerciseId: e.exerciseId, order: j, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, weight: e.weight })) } })) } } });
  }

  // ── Congelación de ejemplo ──
  const frozenMember = activeMembers[20];
  if (frozenMember) {
    const sub = await prisma.subscription.findFirst({ where: { memberId: frozenMember.id, status: 'ACTIVE' } });
    if (sub) {
      await prisma.membershipFreeze.create({ data: { memberId: frozenMember.id, subscriptionId: sub.id, startDate: daysAgo(2), endDate: addDays(now, 8), days: 10, reason: 'Viaje de trabajo' } });
      await prisma.member.update({ where: { id: frozenMember.id }, data: { frozenUntil: addDays(now, 8), expiresAt: addDays(frozenMember.expiresAt ?? now, 10) } });
    }
  }

  // ── Notificaciones in-app ──
  console.log('🔔 Notificaciones...');
  await prisma.notification.createMany({ data: [
    { userId: admin.id, type: 'PAYMENT', title: 'Pago en línea recibido', body: 'Membresía Oro · $180 · Cristina Álvarez', link: '/pagos', createdAt: daysAgo(0, 9, 12) },
    { userId: admin.id, type: 'EXPIRING', title: '5 membresías vencen esta semana', body: 'Revisa la lista de renovaciones pendientes.', link: '/suscripciones', createdAt: daysAgo(0, 8, 0) },
    { userId: admin.id, type: 'STOCK', title: '3 productos con stock bajo', body: 'Batido proteico listo (4), Licra deportiva (3), Toalla microfibra (2)', link: '/tienda', createdAt: daysAgo(1, 8, 0), readAt: daysAgo(1, 10, 0) },
    { userId: admin.id, type: 'BOOKING', title: 'Lista de espera en CrossFit WOD', body: '2 miembros esperan cupo para el sábado 10:00.', link: '/clases/reservas', createdAt: daysAgo(1, 16, 30) },
    { userId: uReception.id, type: 'EXPIRING', title: '5 membresías vencen esta semana', body: 'Contacta a los miembros para ofrecer renovación.', link: '/suscripciones', createdAt: daysAgo(0, 8, 0) },
    { memberId: members[7].id, type: 'BOOKING', title: 'Reserva confirmada: Power Yoga Class', body: 'Lunes · 09:15 – 11:45 · Sala 2', link: '/portal/reservas', createdAt: daysAgo(1, 18, 0) },
    { memberId: members[7].id, type: 'SYSTEM', title: 'Nueva rutina asignada', body: 'Néstor Camelo te asignó “Empuje · Tirón · Pierna”. Revísala en Mi rutina.', link: '/portal/rutina', createdAt: daysAgo(4, 11, 0), readAt: daysAgo(4, 12, 0) },
    { memberId: members[7].id, type: 'PAYMENT', title: 'Pago recibido', body: 'Membresía Miembro VIP · $320', link: '/portal/pagos', createdAt: daysAgo(12, 10, 0), readAt: daysAgo(12, 10, 5) },
  ] });
  await prisma.notificationLog.createMany({ data: [
    { channel: 'EMAIL', template: 'expiring', recipient: 'simon.garcia@gmail.com', subject: 'Tu membresía vence en 2 días', body: '<p>Vista previa</p>', status: 'PREVIEW', createdAt: daysAgo(0, 8, 0) },
    { channel: 'EMAIL', template: 'welcome', recipient: 'nuevo.miembro@gmail.com', subject: '¡Bienvenido/a a GYM PRO!', body: '<p>Vista previa</p>', status: 'PREVIEW', createdAt: daysAgo(2, 15, 0) },
  ] });

  // ── Boletines y avisos ──
  console.log('📰 Boletines y avisos...');
  await prisma.newsletter.createMany({ data: [
    { title: 'Novedades de septiembre', subject: '🏋️ Nuevas clases, reto de fuerza y más', content: 'Este mes estrenamos Power Yoga en horario extendido, abrimos el reto de peso muerto y renovamos la zona de cardio.', audience: 'ACTIVE_MEMBERS', status: 'SENT', sentAt: daysAgo(9), recipientsCount: 41, openRate: 58.3 },
    { title: 'Promo de renovación anticipada', subject: 'Renueva antes del 30 y ahorra 10 %', content: 'Renueva tu membresía antes de que venza y obtén 10 % de descuento en cualquier plan.', audience: 'MEMBERS', status: 'SENT', sentAt: daysAgo(24), recipientsCount: 48, openRate: 46.9 },
    { title: 'Guía de hidratación', subject: 'Cómo hidratarte para rendir mejor', content: 'Laura Ospina comparte pautas de hidratación antes, durante y después del entrenamiento.', audience: 'ALL', status: 'SCHEDULED', scheduledAt: addDays(now, 3) },
    { title: 'Horario de fin de año', subject: 'Horarios especiales de diciembre', content: 'Borrador con los horarios de las festividades.', audience: 'ALL', status: 'DRAFT' },
  ] });
  await prisma.notice.createMany({ data: [
    { title: 'Mantenimiento de la sala de máquinas', content: 'El próximo lunes la sala de máquinas cierra de 06:00 a 14:00 por mantenimiento preventivo.', type: 'WARNING', isPinned: true, startsAt: daysAgo(1), endsAt: addDays(now, 12) },
    { title: '10 % de descuento por renovación anticipada', content: 'Renueva tu plan antes de la fecha de vencimiento y ahorra.', type: 'PROMO', isPinned: true, startsAt: daysAgo(5), endsAt: addDays(now, 20) },
    { title: 'Nueva clase: Power Yoga', content: 'Ya puedes reservar Power Yoga de lunes a sábado a las 09:15 con Valentina Ríos.', type: 'INFO', startsAt: daysAgo(8) },
    { title: 'Uso obligatorio de toalla', content: 'Recuerda usar toalla en todas las máquinas y limpiar el equipo después de usarlo.', type: 'INFO', startsAt: daysAgo(30) },
    { title: 'Simulacro de evacuación', content: 'Este jueves a las 11:00 se realizará un simulacro de evacuación. Sigue las indicaciones del personal.', type: 'URGENT', startsAt: daysAgo(0), endsAt: addDays(now, 4) },
  ] });

  await prisma.auditLog.createMany({ data: [
    { userId: admin.id, action: 'UPDATE', entity: 'Setting', detail: 'Actualizó la tasa de impuesto a 0 %', createdAt: daysAgo(3) },
    { userId: uReception.id, action: 'CREATE', entity: 'Member', entityId: members[0].id, detail: `Registró al miembro ${members[0].firstName} ${members[0].lastName}`, createdAt: daysAgo(2) },
    { userId: uAccountant.id, action: 'UPDATE', entity: 'Payment', detail: 'Marcó como pagada la factura FAC-2025-000112', createdAt: daysAgo(1) },
  ] });

  const counts = { miembros: await prisma.member.count(), pagos: await prisma.payment.count(), asistencias: await prisma.attendance.count(), reservas: await prisma.booking.count(), ventas: await prisma.sale.count() };
  console.log('✅ Datos de demostración creados:', counts);
  console.log('\n👤 Credenciales:\n   admin@gympro.app / admin123\n   recepcion@gympro.app / recepcion123\n   nestor@gympro.app / entrenador123\n   contador@gympro.app / contador123\n   paola@gympro.app / miembro123  (portal del miembro)');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
