// Базовий URL backend API. У продакшені виноси в .env (VITE_API_URL).
const API_BASE_URL = 'http://localhost:5080/api';

const TOKEN_STORAGE_KEY = 'contractiq_token';

// ── Зберігання токена ──
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ── Помилка API з кодом статусу і повідомленням від сервера ──
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, unknown>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '' && v !== 'all')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

// Окрема функція для multipart/form-data (завантаження файлів).
// Content-Type НЕ ставимо вручну — браузер сам додає правильний заголовок
// з boundary, який потрібен серверу для розбору частин форми.
async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearToken();
    throw new ApiError(401, 'Сесія закінчилась. Будь ласка, увійдіть знову.');
  }

  if (!response.ok) {
    let message = `Помилка запиту (${response.status})`;
    try {
      const data = await response.json();
      message = data?.message ?? message;
    } catch {
      // response body wasn't JSON — keep default message
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  uploadFile: <T>(path: string, formData: FormData) =>
    requestFormData<T>(path, formData),
};

// Окремий хелпер для завантаження (скачування) файлу як Blob, з підстановкою токена авторизації.
export async function downloadFile(path: string): Promise<Blob> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new ApiError(response.status, 'Не вдалося завантажити файл');
  }
  return response.blob();
}
