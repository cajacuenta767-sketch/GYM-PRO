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

**Seguridad**: JWT firmado con `JWT_SECRET`; contraseñas con bcrypt; `helmet` y CORS restringido. Los roles de cuenta (`ADMIN`, `STAFF`, `ACCOUNTANT`, `MEMBER`) protegen rutas sensibles y los roles de permisos (`Role.permissions`) permiten un control fino por módulo y acción (`members.read`, `payments.write`, …) que el frontend usa para ocultar navegación.

**Reglas de negocio destacadas**

- *Check-in* (`attendance.service.ts`): resuelve al miembro por QR, código o id; valida estado y vigencia; registra en `AccessLog`; la segunda lectura del día se convierte en salida.
- *Suscripciones* (`subscriptions.service.ts`): transacción que expira la suscripción activa anterior, calcula la fecha de fin según el plan, actualiza al miembro y opcionalmente genera la factura.
- *Ventas* (`products.service.ts`): transacción que valida stock, aplica impuesto configurado y descuenta inventario.
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
- `lib/api.ts`: cliente axios con inyección del token, cierre de sesión automático ante 401 y errores normalizados.

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
- **Configuración**: `Setting` (clave/valor agrupado).

Los campos de tipo/estado se almacenan como cadenas validadas en los DTOs para mantener compatibilidad entre SQLite y PostgreSQL; las etiquetas en español viven en `apps/web/src/lib/labels.ts`.

## Cómo añadir un apartado nuevo

1. **Modelo**: añade la entidad en `schema.prisma` y ejecuta `npm run db:migrate -w apps/api`.
2. **API**: crea `src/modules/<nombre>/` con `dto`, `service` (usa `paginate`), `controller` y `module`; regístralo en `app.module.ts`.
3. **Web**: crea `src/features/<nombre>/<nombre>-page.tsx` usando `CrudPage` (columnas + campos), añade la ruta en `app/router.tsx` y el ítem en `app/nav.ts`.
4. **Permisos**: añade el módulo en `modules/access/permissions.ts` para que aparezca en la matriz de roles.

## Despliegue sugerido

- API: `npm run build -w apps/api` y `node apps/api/dist/main.js` detrás de un proxy inverso (Nginx/Caddy) con HTTPS.
- Web: `npm run build -w apps/web` y servir `apps/web/dist` como estático, apuntando `VITE_API_URL` a la URL pública de la API.
- Base de datos: PostgreSQL gestionado o el `docker-compose.yml` incluido.
