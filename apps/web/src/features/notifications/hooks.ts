import { useQuery } from '@tanstack/react-query';
import { get, list } from '@/lib/api';
import type { AppNotification } from './notifications-list';

export function useNotifications(limit = 30) {
  return useQuery({ queryKey: ['notifications', 'list', limit], queryFn: () => list<AppNotification>('/notifications', { limit }), refetchInterval: 60_000 });
}

export function useUnreadCount() {
  return useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => get<{ count: number }>('/notifications/unread-count'), refetchInterval: 60_000 });
}
