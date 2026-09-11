import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { MembersModule } from './modules/members/members.module';
import { StaffModule } from './modules/staff/staff.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ClassesModule } from './modules/classes/classes.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProductsModule } from './modules/products/products.module';
import { EventsModule } from './modules/events/events.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NewslettersModule } from './modules/newsletters/newsletters.module';
import { NoticesModule } from './modules/notices/notices.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AccessModule } from './modules/access/access.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BranchesModule } from './modules/branches/branches.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PublicModule } from './modules/public/public.module';
import { PortalModule } from './modules/portal/portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    DatabaseModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    MembershipsModule,
    MembersModule,
    StaffModule,
    GroupsModule,
    ClassesModule,
    BookingsModule,
    NutritionModule,
    ActivitiesModule,
    ExercisesModule,
    ProductsModule,
    EventsModule,
    AttendanceModule,
    PaymentsModule,
    MessagesModule,
    NewslettersModule,
    NoticesModule,
    ReportsModule,
    SubscriptionsModule,
    SettingsModule,
    AccessModule,
    BranchesModule,
    RoutinesModule,
    UploadsModule,
    PublicModule,
    PortalModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
