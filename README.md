# GYM PRO · Sistema de gestión de gimnasios

Plataforma completa para administrar un gimnasio: miembros y membresías, equipo, grupos, clases con horario semanal y reservas, planes de nutrición, actividades y ejercicios, tienda con punto de venta, eventos, asistencia con check-in por QR, pagos y facturación, mensajería, boletines, avisos, reportes, configuración y control de acceso por roles.

Inspirado en los apartados de sistemas como GYMVIP, pero con una interfaz moderna (modo claro/oscuro, responsive real con tarjetas en móvil, búsqueda global `Ctrl+K`) y una arquitectura limpia lista para crecer.

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

Documentación interactiva de la API: <http://localhost:4000/api/docs>.

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
│   │           ├── classes/  bookings/  nutrition/  activities/  exercises/  products/
│   │           ├── events/  attendance/  payments/  messages/  newsletters/  notices/
│   │           └── reports/  subscriptions/  settings/  access/
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

## Pasar a PostgreSQL (producción)

1. En `apps/api/prisma/schema.prisma` cambia `provider = "sqlite"` por `provider = "postgresql"`.
2. En `apps/api/.env` define `DATABASE_URL="postgresql://usuario:clave@host:5432/gympro?schema=public"`.
3. Ejecuta `npm run db:migrate -w apps/api` y, si lo deseas, `npm run db:seed`.

El esquema no usa tipos exclusivos de un motor, por lo que el cambio es directo. Hay un `docker-compose.yml` con PostgreSQL listo para usar.

## Variables de entorno

`apps/api/.env`

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `PORT` | Puerto de la API | `4000` |
| `DATABASE_URL` | Conexión a la base de datos | `file:./dev.db` |
| `JWT_SECRET` | Clave para firmar los tokens | cámbiala en producción |
| `JWT_EXPIRES_IN` | Duración de la sesión | `8h` |
| `CORS_ORIGIN` | Orígenes permitidos (separados por coma) | `http://localhost:5173` |

`apps/web/.env`

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API | `/api/v1` (proxy de Vite hacia :4000) |

## Módulos y endpoints principales

Todas las rutas cuelgan de `/api/v1` y, salvo `POST /auth/login`, requieren `Authorization: Bearer <token>`. Los listados aceptan `page`, `limit`, `search`, `sortBy`, `sortDir` y filtros propios.

| Apartado | Rutas |
| --- | --- |
| Autenticación | `POST /auth/login` · `GET /auth/me` · `PATCH /auth/password` |
| Tablero | `GET /dashboard/overview` · `GET /dashboard/calendar` |
| Membresías | `GET/POST /memberships` · `GET/PATCH/DELETE /memberships/:id` |
| Miembros | `GET/POST /members` · `GET /members/stats` · `GET /members/qr/:token` · `/members/:id/measurements` |
| Equipo | `GET/POST /staff` · `GET/PATCH/DELETE /staff/:id` |
| Grupos | `/groups` · `POST /groups/:id/members` · `DELETE /groups/:id/members/:memberId` |
| Clases | `/classes` · `GET /classes/weekly` |
| Reservas | `/bookings` · `GET /bookings/stats` |
| Nutrición | `/nutrition` · `GET /nutrition/member/:id/weekly` |
| Actividades | `/activities` · `GET /activities/categories` |
| Ejercicios | `/exercises` · `/exercises/categories` |
| Tienda | `/store/products` · `/store/categories` · `/store/sales` · `GET /store/stats` |
| Eventos | `/events` · `GET /events/upcoming` · `POST /events/:id/rsvp` |
| Asistencia | `POST /attendance/check-in` · `GET /attendance/today` · `GET /attendance/stats` · `/attendance` |
| Pagos | `/payments` · `GET /payments/stats` |
| Mensajes | `/messages` · `GET /messages/unread-count` · `GET /messages/contacts` |
| Boletines | `/newsletters` · `POST /newsletters/:id/send` |
| Avisos | `/notices` · `GET /notices/active` |
| Reportes | `GET /reports/summary` · `/revenue` · `/members` · `/attendance` · `/classes` · `/store` |
| Suscripciones | `/subscriptions` · `GET /subscriptions/stats` |
| Configuración | `GET /settings` · `PUT /settings` |
| Control de acceso | `/access/roles` · `GET /access/permissions` · `GET /access/logs` · `GET /access/audit` |

## Licencia

Uso privado del propietario del repositorio.
