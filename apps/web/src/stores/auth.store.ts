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
  member?: { id: string; code: string; firstName: string; lastName: string; photoUrl?: string | null } | null;
  staff?: { id: string; code: string; role: string } | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, refreshToken: string, user: AuthUser) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (token, refreshToken, user) => set({ token, refreshToken, user }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      can: (permission) => {
        const u = get().user;
        if (!u) return false;
        if (u.role === 'ADMIN') return true;
        if (!u.permissions?.length) return !permission.endsWith('.delete');
        return u.permissions.includes(permission);
      },
    }),
    { name: 'gympro.auth' },
  ),
);

export const isMemberRole = (u?: AuthUser | null) => u?.role === 'MEMBER';
