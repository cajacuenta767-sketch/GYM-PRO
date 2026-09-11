/** Tipos de dominio compartidos por las vistas. Espejo de los modelos de la API. */

export interface Ref { id: string; name?: string; color?: string; firstName?: string; lastName?: string; photoUrl?: string | null }

export interface MembershipPlan {
  id: string; name: string; description?: string | null; durationDays: number; price: number; registrationFee: number;
  installments: number; color: string; iconUrl?: string | null; benefits: string[]; stripePriceId?: string | null; isActive: boolean;
  activities: { id: string; name: string; category: string }[]; membersCount: number; subscriptionsCount: number; createdAt: string;
}

export interface Member {
  id: string; code: string; firstName: string; lastName: string; email?: string | null; phone?: string | null; address?: string | null;
  birthDate?: string | null; gender?: string | null; photoUrl?: string | null; username?: string | null; planId?: string | null;
  trainerId?: string | null; interestArea?: string | null; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED'; joinDate: string;
  expiresAt?: string | null; emergencyContact?: string | null; notes?: string | null; qrToken: string; createdAt: string;
  plan?: { id: string; name: string; color: string } | null; trainer?: { id: string; firstName: string; lastName: string } | null;
}

export interface MemberDetail extends Member {
  plan?: { id: string; name: string; color: string; price: number; durationDays: number } | null;
  trainer?: { id: string; firstName: string; lastName: string; photoUrl?: string | null; specialty?: string | null } | null;
  groups: { id: string; name: string; color: string }[];
  classes: { id: string; name: string; color: string }[];
  subscriptions: Subscription[]; payments: Payment[]; attendance: Attendance[]; bookings: Booking[]; measurements: Measurement[];
}

export interface Measurement { id: string; memberId: string; type: string; value: number; unit: string; note?: string | null; measuredAt: string }

export interface Staff {
  id: string; code: string; firstName: string; lastName: string; email?: string | null; phone?: string | null; role: string;
  specialty?: string | null; photoUrl?: string | null; hireDate: string; salary?: number | null; bio?: string | null; isActive: boolean;
  _count?: { members: number; classes: number; activities: number };
}

export interface Group { id: string; name: string; description?: string | null; imageUrl?: string | null; color: string; members: Ref[]; membersCount: number }

export interface ClassSchedule { id: string; classId: string; dayOfWeek: number; startTime: string; endTime: string }
export interface GymClass {
  id: string; name: string; description?: string | null; trainerId?: string | null; location?: string | null; capacity: number;
  bookingFee: number; color: string; isActive: boolean; trainer?: Ref | null; schedules: ClassSchedule[];
  _count?: { members: number; bookings: number };
}
export interface WeeklySlot { scheduleId: string; classId: string; name: string; color: string; location?: string | null; trainer?: string | null; startTime: string; endTime: string; capacity: number }

export interface Booking {
  id: string; memberId: string; classId: string; scheduleId?: string | null; date: string; status: string; paid: boolean; amount: number;
  member?: Ref & { code: string }; class?: { id: string; name: string; color: string; location?: string | null };
}

export interface Subscription {
  id: string; memberId: string; planId: string; startDate: string; endDate: string; price: number; status: string; notes?: string | null;
  member?: Ref & { code: string }; plan?: { id: string; name: string; color: string; durationDays?: number };
  payments?: { id: string; invoiceNumber: string; amount: number; status: string; paidAt: string }[];
}

export interface Payment {
  id: string; invoiceNumber: string; memberId: string; subscriptionId?: string | null; concept: string; amount: number; method: string;
  status: string; reference?: string | null; notes?: string | null; paidAt: string; dueDate?: string | null;
  member?: Ref & { code: string };
}

export interface Attendance {
  id: string; memberId: string; checkIn: string; checkOut?: string | null; method: string; note?: string | null;
  member?: Ref & { code: string; status?: string; plan?: { name: string; color: string } | null };
}

export interface Activity { id: string; name: string; category: string; trainerId?: string | null; description?: string | null; durationMin?: number | null; calories?: number | null; trainer?: Ref | null }
export interface ExerciseCategory { id: string; name: string; description?: string | null; muscleGroup?: string | null; _count?: { exercises: number } }
export interface Exercise { id: string; name: string; categoryId?: string | null; description?: string | null; difficulty: string; sets?: number | null; reps?: number | null; restSeconds?: number | null; equipment?: string | null; videoUrl?: string | null; category?: ExerciseCategory | null }

export interface Product { id: string; name: string; sku: string; categoryId?: string | null; description?: string | null; price: number; cost: number; stock: number; minStock: number; imageUrl?: string | null; isActive: boolean; category?: { id: string; name: string } | null }
export interface Sale { id: string; number: string; total: number; subtotal: number; discount: number; tax: number; paymentMethod: string; createdAt: string; member?: Ref & { code: string } | null; staff?: Ref | null; items: { id: string; quantity: number; unitPrice: number; total: number; product: { id: string; name: string; sku: string } }[] }

export interface GymEvent { id: string; title: string; description?: string | null; type: string; startsAt: string; endsAt?: string | null; location?: string | null; capacity?: number | null; fee: number; color: string; isPublic: boolean; _count?: { rsvps: number } }

export interface Message { id: string; senderId: string; recipientId: string; subject: string; body: string; readAt?: string | null; createdAt: string; sender: { id: string; name: string; email: string; avatarUrl?: string | null; role: string }; recipient: { id: string; name: string; email: string; avatarUrl?: string | null; role: string } }
export interface Newsletter { id: string; title: string; subject: string; content: string; audience: string; status: string; scheduledAt?: string | null; sentAt?: string | null; recipientsCount: number; openRate?: number | null; createdAt: string }
export interface Notice { id: string; title: string; content: string; type: string; audience: string; isPinned: boolean; startsAt: string; endsAt?: string | null; createdAt: string }
export interface NutritionItem { id: string; memberId: string; nutritionistId?: string | null; dayOfWeek: number; mealType: string; description: string; calories?: number | null; protein?: number | null; carbs?: number | null; fats?: number | null; member?: Ref & { code: string }; nutritionist?: Ref | null }
export interface Role { id: string; name: string; description?: string | null; permissions: string[]; isSystem: boolean; usersCount?: number }
export interface AppUser { id: string; email: string; name: string; role: string; roleId?: string | null; avatarUrl?: string | null; isActive: boolean; lastLoginAt?: string | null; createdAt: string; accessRole?: { id: string; name: string } | null }
export interface AccessLog { id: string; memberId?: string | null; method: string; allowed: boolean; reason?: string | null; gate?: string | null; at: string; member?: Ref & { code: string } | null }
