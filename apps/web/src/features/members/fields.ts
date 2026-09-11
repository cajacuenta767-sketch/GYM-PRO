import type { FieldConfig } from '@/components/auto-form';
import { GENDER, MEMBER_STATUS, toOptions } from '@/lib/labels';

export const memberFields: FieldConfig[] = [
  { name: 'firstName', label: 'Nombre', required: true, placeholder: 'Paola' },
  { name: 'lastName', label: 'Apellidos', required: true, placeholder: 'Restrepo Vélez' },
  { name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'paola@gmail.com' },
  { name: 'phone', label: 'Teléfono móvil', type: 'tel', placeholder: '+57 300 000 0000' },
  { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'gender', label: 'Género', type: 'select', options: toOptions(GENDER) },
  { name: 'address', label: 'Dirección', colSpan: 2, placeholder: 'Calle 24 C 38' },
  { name: 'photoUrl', label: 'Foto', type: 'image' },
  { name: 'planId', label: 'Tipo de membresía', type: 'select', source: 'plans', section: 'Afiliación' },
  { name: 'branchId', label: 'Sede', type: 'select', source: 'branches' },
  { name: 'status', label: 'Estado', type: 'select', options: toOptions(MEMBER_STATUS), required: true },
  { name: 'joinDate', label: 'Fecha de ingreso', type: 'date' },
  { name: 'expiresAt', label: 'Fecha de caducidad', type: 'date' },
  { name: 'trainerId', label: 'Entrenador asignado', type: 'select', source: 'trainers' },
  { name: 'interestArea', label: 'Área de interés', placeholder: 'Pesas, cardio, yoga…' },
  { name: 'groupIds', label: 'Grupos', type: 'multiselect', source: 'groups' },
  { name: 'classIds', label: 'Clases inscritas', type: 'multiselect', source: 'classes' },
  { name: 'username', label: 'Nombre de usuario', section: 'Otros datos' },
  { name: 'emergencyContact', label: 'Contacto de emergencia', placeholder: 'Nombre · teléfono' },
  { name: 'notes', label: 'Notas internas', type: 'textarea' },
  { name: 'portalPassword', label: 'Contraseña del portal (opcional)', type: 'password', hint: 'Crea o restablece el acceso del miembro al portal. Requiere correo.' },
];

export const memberToForm = (m: any) => ({
  ...m,
  groupIds: m.groups?.map((g: any) => g.id) ?? [],
  classIds: m.classes?.map((c: any) => c.id) ?? [],
});
