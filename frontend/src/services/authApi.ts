import { api, setToken, clearToken, getToken } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiAuthResponse, ApiUser } from './apiTypes';
import type { User } from '../types';

function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: toUiStatus(u.role) as User['role'],
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const res = await api.post<ApiAuthResponse>('/auth/login', { email, password });
    setToken(res.token);
    return mapUser(res.user);
  },

  async me(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const res = await api.get<ApiUser>('/auth/me');
      return mapUser(res);
    } catch {
      return null;
    }
  },

  logout(): void {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },
};
