import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'ACCOUNTANT' | 'MEMBER';
  roleName?: string | null;
  avatarUrl?: string | null;
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      can: (permission) => {
        const u = get().user;
        if (!u) return false;
        if (u.role === 'ADMIN') return true;
        return u.permissions?.includes(permission) ?? false;
      },
    }),
    { name: 'gympro.auth' },
  ),
);
