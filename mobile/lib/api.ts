import Constants from 'expo-constants';
import { supabase } from './supabase';

// Extraemos la IP local dynamica que está usando Expo Go (e.g., 192.168.x.x)
const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost?.split(':')[0] || 'localhost';
// El backend NestJS corre en el puerto 3001
export const API_URL = `http://${localIp}:3001`;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    ...((options.headers as object) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Network request failed' };
      }
      
      const error = new Error(errorData.message || 'API Request Failed');
      (error as any).status = response.status;
      throw error;
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out');
    }
    throw error;
  }
};

export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' }),
};
