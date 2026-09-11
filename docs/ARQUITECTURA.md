# Arquitectura de GYM PRO

## Visión general

```
┌──────────────────────┐        HTTP/JSON (/api/v1)        ┌──────────────────────┐        Prisma        ┌────────────┐
│  apps/web (React)    │ ───────────────────────────────▶ │  apps/api (NestJS)   │ ──────────────────▶ │  SQLite /  │
│  SPA + TanStack Query│ ◀─────────────────────────────── │  módulos por dominio │ ◀────────────────── │ PostgreSQL │
└──────────────────────┘                                   └──────────────────────┘                      └────────────┘
```

Dos aplicaciones desacopladas dentro de un monorepo. La web nunca accede a la base de datos: todo pasa por la API, que valida, autoriza y aplica las reglas de negocio.

## Backend (`apps/api`)

**Patrón**: arquitectura modular de NestJS. Cada apartado del sistema es un módulo autocontenido con tres piezas:

- `*.controller.ts` — define las rutas, decora con Swagger y delega en el servicio. No contiene lógica.
- `*.service.ts` — lógica de negocio y acceso a datos mediante `PrismaService`.
- `dto/*.dto.ts` — contratos de entrada validados con `class-validator` (el `ValidationPipe` global rechaza campos desconocidos y convierte tipos).

**Capa común (`src/common`)**

- `utils/paginate.ts`: paginación, búsqueda libre (`search` sobre campos configurables, incluidas relaciones con notación `trainer.firstName`) y ordenamiento seguro (solo campos permitidos). Todos los listados la usan, por lo que la API responde siempre `{ success, data, meta }`.
- `guards/`: `JwtAuthGuard` (global; `@Public()` para excepciones) y `RolesGuard` (`@Roles('ADMIN', ...)`).
- `filters/`: convierten errores de Prisma (duplicados, no encontrado, relaciones) y excepciones HTTP en respuestas uniformes.
- `interceptors/transform.interceptor.ts`: envuelve cada respuesta en `{ success, data }`.

**Seguridad**: JWT de acceso (corta duración) + refresh tokens rotativos guardados con hash (`RefreshToken`); contraseñas con bcrypt; `helmet`, CORS restringido y límite de intentos de login (`@nestjs/throttler`). Cadena de guards globales:

1. `ThrottlerGuard`: límite de peticiones por IP.
2. `JwtAuthGuard`: exige token salvo rutas `@Public()`.
3. `RolesGuard`: `ADMIN` todo; `MEMBER` solo rutas `@PortalAccess()`; `@Roles(...)` restringe por tipo de cuenta.
4. `PermissionsGuard`: cada controlador declara `@ModuleKey('members')`; el guard deriva la acción del método HTTP (`GET → read`, `POST/PATCH → write`, `DELETE → delete`) y la compara con los permisos del rol del usuario (`members.write`). Sin rol asignado aplica un mapa por defecto.

`AuditInterceptor` registra en `AuditLog` toda operación de escritura (usuario, módulo, entidad, detalle).

**Integraciones desacopladas**

- Pagos: interfaz `PaymentProvider` con `StripePaymentProvider` (Checkout + webhook firmado) y `MockPaymentProvider` (demostración). `PaymentsService.confirmCheckout` crea la suscripción y activa al miembro en una transacción.
- Correo: `MailService` envía por SMTP (variables de entorno o ajustes) o guarda una vista previa en `NotificationLog`. Plantillas en `notifications/templates.ts`.
- Tareas programadas: `NotificationsService.runDaily` (`@Cron` 08:00) avisa vencimientos, cumpleaños y stock bajo; también se puede lanzar desde el panel.
- Archivos: `POST /uploads` con multer guarda imágenes en `apps/api/uploads` y se sirven como estáticos.

**Reglas de negocio destacadas**

- *Check-in* (`attendance.service.ts`): resuelve al miembro por QR, código o id; valida estado y vigencia; registra en `AccessLog`; la segunda lectura del día se convierte en salida.
- *Suscripciones* (`subscriptions.service.ts`): transacción que expira la suscripción activa anterior, calcula la fecha de fin según el plan, actualiza al miembro y opcionalmente genera la factura.
- *Ventas* (`products.service.ts`): transacción que valida stock, aplica impuesto configurado y descuenta inventario.
- *Reservas* (`bookings.service.ts`): si la clase está llena y se pide `waitlist`, la reserva queda `WAITLISTED`; al cancelar una confirmada se promueve a la primera en espera y se notifica.
- *Congelación* (`subscriptions.service.ts`): extiende el fin de la suscripción y el vencimiento del miembro, y fija `frozenUntil`; el check-in lo respeta.
- *Portal* (`portal.service.ts`): resuelve siempre al miembro vinculado a la cuenta autenticada; ningún endpoint del portal acepta un `memberId` externo.
- *Reportes y tablero*: agregaciones en memoria sobre consultas acotadas por fecha para mantener el esquema portable entre SQLite y PostgreSQL.

## Frontend (`apps/web`)

**Patrón**: organización por *features* con una capa de componentes reutilizables.

- `components/ui`: primitivas de diseño (botones, inputs, badges, avatares, diálogos, tabs, tooltips, tarjetas de indicadores). Encapsulan Radix UI para accesibilidad.
- `components/data-table.tsx`: tabla conectada a `useList` con búsqueda, ordenamiento, paginación y acciones por fila. En pantallas pequeñas se transforma en tarjetas.
- `components/auto-form.tsx`: genera formularios desde una configuración `FieldConfig[]` (texto, número, fecha, select con catálogo remoto, multiselección con chips, switch, color, campo personalizado). Normaliza fechas y vacíos antes de enviar.
- `components/crud-page.tsx`: página CRUD completa (cabecera, tabla, crear/editar en diálogo, eliminar con confirmación). La mayoría de apartados se definen con columnas + campos en menos de 100 líneas.
- `hooks/use-list.ts`: estado de listado (página, límite, búsqueda con *debounce*, orden, filtros) + consulta con TanStack Query.
- `hooks/use-options.ts`: catálogos ligeros (miembros, planes, clases…) cacheados para selects.
- `stores/`: sesión persistida (`gympro.auth`) y preferencias de UI (tema, menú contraído).
- `lib/api.ts`: cliente axios con inyección del token, renovación transparente con refresh token ante 401 (una sola renovación concurrente), descarga de archivos protegidos y errores normalizados.
- `features/portal`: layout propio (`PortalShell`) con navegación inferior en móvil; rutas protegidas por rol (`MemberOnly` / `StaffOnly` en `app/router.tsx`).
- `components/qr-scanner.tsx`: lectura de QR con `getUserMedia` + jsQR.
- PWA con `vite-plugin-pwa` (manifest e iconos en `public/icons`).

**Diseño**

- Tokens de color en `styles/globals.css` como variables RGB para tema claro y oscuro; Tailwind los expone como `bg-surface`, `text-ink-2`, `bg-brand`, etc.
- Tipografía: *Sora* para títulos e indicadores, *DM Sans* para interfaz.
- Acento de marca lima (`#C3F13D`) sobre carbón; paleta categórica de gráficas con la misma luminosidad y distinto matiz.

## Modelo de datos (resumen)

- **Seguridad**: `User`, `Role`, `AccessLog`, `AuditLog`.
- **Miembros**: `Member`, `Measurement`, `Subscription`, `MembershipPlan`, `MembershipPlanActivity`, `Group`, `GroupMember`.
- **Equipo**: `Staff`.
- **Entrenamiento**: `GymClass`, `ClassSchedule`, `MemberClass`, `Booking`, `NutritionSchedule`, `Activity`, `ExerciseCategory`, `Exercise`.
- **Operación**: `Attendance`, `Payment`, `Product`, `ProductCategory`, `Sale`, `SaleItem`, `Event`, `EventRsvp`.
- **Comunicación**: `Message`, `Newsletter`, `Notice`.
- **Configuración**: `Setting` (clave/valor agrupado), `Branch` (sedes).
- **Entrenamiento avanzado**: `Routine`, `RoutineDay`, `RoutineExercise`.
- **Notificaciones**: `Notification` (in-app por usuario o miembro), `NotificationLog` (correos), `RefreshToken`, `MembershipFreeze`.

Los campos de tipo/estado se almacenan como cadenas validadas en los DTOs para mantener compatibilidad entre SQLite y PostgreSQL; las etiquetas en español viven en `apps/web/src/lib/labels.ts`.

## Cómo añadir un apartado nuevo

1. **Modelo**: añade la entidad en `schema.prisma` y ejecuta `npm run db:migrate -w apps/api`.
2. **API**: crea `src/modules/<nombre>/` con `dto`, `service` (usa `paginate`), `controller` y `module`; regístralo en `app.module.ts`.
3. **Web**: crea `src/features/<nombre>/<nombre>-page.tsx` usando `CrudPage` (columnas + campos), añade la ruta en `app/router.tsx` y el ítem en `app/nav.ts`.
4. **Permisos**: añade el módulo en `modules/access/permissions.ts` para que aparezca en la matriz de roles.

## Pruebas

- **API** (`apps/api/test`): Jest + supertest levantan la aplicación completa contra una base SQLite desechable (`test.db`) sembrada con los datos de demo. Cubren autenticación y refresh, permisos por rol, alta de miembros, check-in y denegaciones, suscripciones y congelación, lista de espera, ventas y stock, checkout en línea, PDF, reportes y la tarea diaria. `npm test -w apps/api`.
- **Extremo a extremo** (`apps/web/e2e`): Playwright con sesiones por rol guardadas en `global-setup.ts`. Cubren inicio de sesión, tablero, alta de miembro, búsqueda global, horario, check-in, permisos de menú, portal del miembro, reserva y página pública. `npm run test:e2e -w apps/web`.
- **CI** (`.github/workflows/ci.yml`): tipos, compilación, pruebas de API y Playwright en cada push y pull request.

## Despliegue sugerido

- API: `npm run build -w apps/api` y `node apps/api/dist/main.js` detrás de un proxy inverso (Nginx/Caddy) con HTTPS.
- Web: `npm run build -w apps/web` y servir `apps/web/dist` como estático, apuntando `VITE_API_URL` a la URL pública de la API.
- Base de datos: PostgreSQL gestionado o el `docker-compose.yml` incluido (PostgreSQL + API con `prisma migrate deploy` + web con nginx que hace proxy de `/api` y `/uploads`).
- Variables sensibles (`JWT_SECRET`, Stripe, SMTP) siempre por entorno; nunca en el repositorio.
