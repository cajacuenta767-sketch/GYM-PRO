# GYM PRO · Sistema de gestión de gimnasios

Plataforma completa para administrar un gimnasio: miembros y membresías, equipo, grupos, clases con horario semanal, reservas con lista de espera, rutinas de entrenamiento, planes de nutrición, tienda con punto de venta, eventos, asistencia con check-in por QR (lector o cámara), pagos con facturación en PDF y cobro en línea, notificaciones por correo e in-app, mensajería, boletines, avisos, reportes, multi-sede, configuración y control de acceso por roles y permisos.

Incluye un **portal del miembro** (carnet digital con QR, reservas, rutina, nutrición, progreso, pagos y renovación en línea), una **página pública** con planes y horario, y funciona como **PWA** instalable.

Inspirado en los apartados de sistemas como GYMVIP, pero con una interfaz moderna (modo claro/oscuro, responsive real, búsqueda global `Ctrl+K`) y una arquitectura limpia lista para crecer.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query · React Router · react-hook-form · Recharts · Radix UI |
| Backend | NestJS 10 · Prisma ORM · JWT (Passport) · class-validator · Swagger |
| Base de datos | SQLite en desarrollo (cero configuración) · PostgreSQL en producción |
| Monorepo | npm workspaces (`apps/api`, `apps/web`) |

## Inicio rápido

Requisitos: Node.js 20 o superior.

```bash
npm install                 # instala api y web
npm run db:migrate -w apps/api -- --name init   # crea la base de datos (o: npm run db:push -w apps/api)
npm run db:seed             # datos de demostración
npm run dev                 # API en :4000 y web en :5173
```

Abre <http://localhost:5173> y entra con una cuenta de demostración:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@gympro.app | admin123 |
| Recepción | recepcion@gympro.app | recepcion123 |
| Entrenador | nestor@gympro.app | entrenador123 |
| Contador | contador@gympro.app | contador123 |
| Miembro (portal) | paola@gympro.app | miembro123 |

Documentación interactiva de la API: <http://localhost:4000/api/docs>. Página pública: <http://localhost:5173/publico>.

## Funcionalidades destacadas

- **Portal del miembro**: carnet con QR, reserva de clases (lista de espera automática), rutina asignada, plan nutricional, progreso de peso y visitas, facturas en PDF y renovación con pago en línea.
- **Asistencia**: check-in por lector QR, cámara del dispositivo, código de miembro o registro manual; valida vencimiento, estado y congelación.
- **Pagos en línea**: pasarela abstracta (`PaymentProvider`). Con `STRIPE_SECRET_KEY` usa Stripe Checkout y webhook; sin clave usa una pasarela de demostración. Enlace de cobro desde el panel.
- **Notificaciones**: correo (SMTP real o vista previa en el panel) e in-app; tarea diaria de vencimientos, cumpleaños y stock bajo; confirmación de reservas y pagos.
- **Rutinas**: plantillas reutilizables y rutinas por miembro con días, ejercicios, series, repeticiones, descanso y carga.
- **Operación**: congelación de membresías, multi-sede, importación de miembros desde CSV/Excel, exportación, acciones en lote, subida de imágenes, asistente de configuración inicial.
- **Seguridad**: JWT con refresh tokens rotativos, límite de intentos de inicio de sesión, permisos finos por módulo y acción, auditoría automática de cambios, verificación del cobro con la pasarela antes de activar una suscripción.
- **Operación diaria**: agenda personal del entrenador (clases de hoy, reservas, miembros a cargo), caja del día por método de pago, carnet del miembro en PDF con QR, ticket de venta en PDF, línea de tiempo por miembro, aforo máximo en tiempo real, enlaces de WhatsApp, copia de seguridad en JSON y vencimiento automático de membresías cada día.

## Estructura del repositorio

```
gym-pro/
├── apps/
│   ├── api/                      # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 30 modelos de datos
│   │   │   └── seed.ts           # datos de demostración
│   │   └── src/
│   │       ├── main.ts           # bootstrap, CORS, validación global, Swagger
│   │       ├── app.module.ts     # registro de módulos y guards globales
│   │       ├── config/           # configuración por variables de entorno
│   │       ├── database/         # PrismaService (módulo global)
│   │       ├── common/           # decoradores, DTOs, filtros, guards, interceptores, utilidades
│   │       └── modules/          # un módulo por apartado (controller + service + dto)
│   │           ├── auth/  users/  dashboard/  memberships/  members/  staff/  groups/
│   │           ├── classes/  bookings/  nutrition/  routines/  activities/  exercises/
│   │           ├── products/  events/  attendance/  payments/  messages/  newsletters/
│   │           ├── notices/  notifications/  reports/  subscriptions/  settings/  access/
│   │           └── branches/  uploads/  public/  portal/
│   │   └── test/                 # pruebas de integración (Jest + supertest)
│   └── web/                      # Frontend React
│       └── src/
│           ├── app/              # router, providers, definición de navegación
│           ├── components/
│           │   ├── ui/           # primitivas: botón, input, badge, avatar, diálogo, tabs…
│           │   ├── layout/       # sidebar, topbar, paleta de comandos, app shell
│           │   ├── charts/       # gráficas Recharts con estilo unificado
│           │   ├── data-table.tsx    # tabla paginada, ordenable, con modo tarjeta en móvil
│           │   ├── auto-form.tsx     # formularios generados desde una configuración
│           │   └── crud-page.tsx     # página CRUD completa declarativa
│           ├── features/         # una carpeta por apartado (páginas y campos de formulario)
│           │   ├── portal/       # portal del miembro (layout propio y páginas)
│           │   └── public/       # página pública del gimnasio
│       └── e2e/                  # pruebas de extremo a extremo (Playwright)
│           ├── hooks/            # useList (listados paginados), useOptions (catálogos), useDebounce
│           ├── lib/              # cliente HTTP, formato de fechas/moneda, etiquetas y colores
│           ├── stores/           # sesión (auth) y preferencias de UI (zustand)
│           ├── styles/           # tokens de color y estilos globales
│           └── types/            # tipos de dominio
├── docs/ARQUITECTURA.md          # decisiones técnicas y guía para extender el sistema
└── package.json                  # scripts del monorepo
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta API y web en paralelo |
| `npm run build` | Compila ambos proyectos |
| `npm run db:migrate` | Crea/aplica migraciones de Prisma |
| `npm run db:seed` | Reinicia la base con datos de demostración |
| `npm run db:studio` | Abre Prisma Studio para explorar los datos |
| `npm run lint` | Lint de ambos proyectos |
| `npm test` | Pruebas de integración de la API (crea y siembra `test.db`) |
| `npm run test:e2e -w apps/web` | Pruebas Playwright (levanta API y web si no están corriendo) |
| `docker compose up -d --build` | Despliegue completo con PostgreSQL, API y web en <http://localhost:8080> |

## Pasar a PostgreSQL (producción)

1. En `apps/api/prisma/schema.prisma` cambia `provider = "sqlite"` por `provider = "postgresql"`.
2. En `apps/api/.env` define `DATABASE_URL="postgresql://usuario:clave@host:5432/gympro?schema=public"`.
3. Las migraciones incluidas están generadas para SQLite. Bórralas y crea la inicial para PostgreSQL: `rm -rf apps/api/prisma/migrations && npm run db:migrate -w apps/api -- --name init`.
4. Si lo deseas, `npm run db:seed`.

El esquema no usa tipos exclusivos de un motor, por lo que el cambio es directo. El `docker-compose.yml` levanta PostgreSQL, la API (aplica `prisma migrate deploy` al arrancar) y la web con nginx.

## Variables de entorno

`apps/api/.env`

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `PORT` | Puerto de la API | `4000` |
| `DATABASE_URL` | Conexión a la base de datos | `file:./dev.db` |
| `JWT_SECRET` | Clave para firmar los tokens | cámbiala en producción |
| `JWT_EXPIRES_IN` | Duración de la sesión | `8h` |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) | `http://localhost:5173` |
| `WEB_URL` | URL pública de la web (enlaces en correos y retorno de pagos) | `http://localhost:5173` |
| `LOGIN_RATE_LIMIT` | Intentos de inicio de sesión por minuto e IP | `10` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Activan Stripe Checkout; vacíos = pasarela de demostración | — |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Correo saliente; vacíos = vista previa en el panel (también configurables desde Configuración) | — |

`apps/web/.env`

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API | `/api/v1` (proxy de Vite hacia :4000) |

## Módulos y endpoints principales

Todas las rutas cuelgan de `/api/v1` y, salvo `POST /auth/login`, requieren `Authorization: Bearer <token>`. Los listados aceptan `page`, `limit`, `search`, `sortBy`, `sortDir` y filtros propios.

| Apartado | Rutas |
| --- | --- |
| Autenticación | `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` · `PATCH /auth/password` |
| Tablero | `GET /dashboard/overview` · `GET /dashboard/calendar` |
| Membresías | `GET/POST /memberships` · `GET/PATCH/DELETE /memberships/:id` |
| Miembros | `GET/POST /members` · `GET /members/stats` · `GET /members/qr/:token` · `/members/:id/measurements` · `GET /members/:id/card.pdf` · `GET /members/:id/timeline` · `POST /members/import` · `GET /members/export` · `POST /members/bulk` · `POST /members/:id/portal-account` |
| Equipo | `GET/POST /staff` · `GET /staff/me/agenda` (agenda personal) |
| Grupos | `/groups` · `POST /groups/:id/members` · `DELETE /groups/:id/members/:memberId` |
| Clases | `/classes` · `GET /classes/weekly` |
| Reservas | `/bookings` · `GET /bookings/stats` · `POST /bookings/:id/cancel` · `GET /bookings/:id/waitlist-position` |
| Rutinas | `/routines` · `POST /routines/:id/assign` · `GET /routines/member/:id/active` |
| Nutrición | `/nutrition` · `GET /nutrition/member/:id/weekly` |
| Actividades | `/activities` · `GET /activities/categories` |
| Ejercicios | `/exercises` · `/exercises/categories` |
| Tienda | `/store/products` · `/store/categories` · `/store/sales` · `GET /store/sales/:id/receipt.pdf` · `GET /store/stats` |
| Eventos | `/events` · `GET /events/upcoming` · `POST /events/:id/rsvp` |
| Asistencia | `POST /attendance/check-in` · `GET /attendance/today` · `GET /attendance/stats` · `/attendance` |
| Pagos | `/payments` · `GET /payments/stats` · `POST /payments/checkout` · `POST /payments/checkout/confirm` · `POST /payments/webhooks/stripe` · `GET /payments/:id/invoice.pdf` |
| Notificaciones | `/notifications` · `GET /notifications/unread-count` · `PATCH /notifications/read-all` · `POST /notifications/test-email` · `POST /notifications/run-daily` · `GET /notifications/logs` |
| Mensajes | `/messages` · `GET /messages/unread-count` · `GET /messages/contacts` |
| Boletines | `/newsletters` · `POST /newsletters/:id/send` |
| Avisos | `/notices` · `GET /notices/active` |
| Reportes | `GET /reports/summary` · `/revenue` · `/members` · `/attendance` · `/classes` · `/store` · `/cash?date=` |
| Suscripciones | `/subscriptions` · `GET /subscriptions/stats` · `POST /subscriptions/:id/freeze` · `POST /subscriptions/:id/unfreeze` |
| Sedes | `/branches` |
| Archivos | `POST /uploads` (imágenes, servidas en `/uploads/*`) |
| Portal del miembro | `GET /portal/home` · `/portal/bookings` · `/portal/routine` · `/portal/nutrition` · `/portal/measurements` · `/portal/payments` · `/portal/plans` · `POST /portal/checkout` · `/portal/events` · `PATCH /portal/profile` |
| Público | `GET /public/info` (sin autenticación) |
| Configuración | `GET /settings` · `PUT /settings` · `GET /settings/backup` |
| Control de acceso | `/access/roles` · `GET /access/permissions` · `GET /access/logs` · `GET /access/audit` |

## Licencia

Uso privado del propietario del repositorio.
