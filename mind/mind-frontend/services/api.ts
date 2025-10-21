import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from '../services/auth';

type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
};

const getBaseUrl = () => {
  // App config (app.json -> extra)
  const extra: any = Constants.expoConfig?.extra || {};
  const publicEnv = process.env.EXPO_PUBLIC_API_URL;

  // Prioridad por plataforma si está definida
  if (Platform.OS === 'android' && extra?.androidApiUrl) return extra.androidApiUrl;
  if ((Platform.OS === 'ios' || Platform.OS === 'macos') && extra?.iosApiUrl) return extra.iosApiUrl;

  // URL pública (opcional)
  if (publicEnv) return publicEnv;
  if (extra?.apiUrl) return extra.apiUrl;

  // Fallbacks comunes
  if (Platform.OS === 'android') return 'http://10.0.2.2:3002';
  return 'http://localhost:3002';
};

const BASE_URL = getBaseUrl();

// Base URL para servicio administrativo (menús, auditoría admin, etc.)
const getAdminBaseUrl = () => {
  const extra: any = Constants.expoConfig?.extra || {};
  const publicEnv = process.env.EXPO_PUBLIC_ADMIN_API_URL;
  // Prioridad por plataforma si está definida
  if (Platform.OS === 'android' && extra?.androidAdminApiUrl) return extra.androidAdminApiUrl;
  if ((Platform.OS === 'ios' || Platform.OS === 'macos') && extra?.iosAdminApiUrl) return extra.iosAdminApiUrl;
  if (publicEnv) return publicEnv;
  if (extra?.adminApiUrl) return extra.adminApiUrl;
  // Fallbacks
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
};
const ADMIN_BASE_URL = getAdminBaseUrl();

async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      // Ayuda a Expo Web/Chrome con CORS
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch (e: any) {
    // Error de red/CORS
    const err = new Error(`No se pudo conectar al servicio (URL: ${url}). Verifica que esté corriendo y accesible.`) as any;
    err.cause = e;
    err.network = true;
    throw err;
  }

  // Intentar parsear JSON si existe cuerpo
  let json: ApiResponse<T> | null = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch (e) {
      // Cuerpo no parseable
      const err = new Error(`Respuesta inválida del servidor (${res.status}).`) as any;
      err.status = res.status;
      throw err;
    }
  } else if (res.status === 204) {
    json = { success: res.ok } as any;
  } else {
    // Intentar como texto y envolver
    const text = await res.text();
    json = { success: res.ok, message: text } as any;
  }

  if (!res.ok || json?.success === false) {
    const msg = (json && json.message) || `Error ${res.status}`;
    const err = new Error(msg) as any;
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json as ApiResponse<T>;
}

async function adminFetch<T = any>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${ADMIN_BASE_URL}${path}`;
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch (e: any) {
    const err = new Error(`No se pudo conectar al servicio administrativo (URL: ${url}). Verifica que esté corriendo y accesible.`) as any;
    err.cause = e;
    err.network = true;
    throw err;
  }

  let json: ApiResponse<T> | null = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch (e) {
      const err = new Error(`Respuesta inválida del servidor (${res.status}).`) as any;
      err.status = res.status;
      throw err;
    }
  } else if (res.status === 204) {
    json = { success: res.ok } as any;
  } else {
    const text = await res.text();
    json = { success: res.ok, message: text } as any;
  }

  if (!res.ok || json?.success === false) {
    const msg = (json && json.message) || `Error ${res.status}`;
    const err = new Error(msg) as any;
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json as ApiResponse<T>;
}

// Auth API
export async function login(email: string, password: string) {
  return apiFetch<{ usuario: any; token: string }>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

type RegisterPayload = {
  persona: {
    nombres: string;
    apellidos: string;
    tipoDoc?: 'CC' | 'TI' | 'CE' | 'PP' | 'RC';
    numDoc: string;
    fechaNacimiento: string; // ISO
    idPais?: string;
    idDepartamento?: string;
    idCiudad?: string;
  };
  usuario: {
    idTipoUsuario?: string;
    email: string;
    telefono?: string;
    passwordHash: string; // API espera el campo "passwordHash"
  };
};

export async function register(payload: RegisterPayload) {
  return apiFetch(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string) {
  return apiFetch(`/api/auth/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Send verification email after registration
export async function sendVerificationEmail(usuarioId: string) {
  return apiFetch(`/api/auth/send-verification`, {
    method: 'POST',
    body: JSON.stringify({ usuarioId }),
  });
}

// Verify code and complete registration
export async function verifyRegistrationCode(usuarioId: string, code: string) {
  return apiFetch(`/api/auth/verify-code`, {
    method: 'POST',
    body: JSON.stringify({ usuarioId, code }),
  });
}

// Get user profile
export async function getUserProfile() {
  return apiFetch(`/api/auth/profile`, {
    method: 'GET',
  });
}

// Tipos y API de Menús (Administrativo)
export type MenuItem = {
  _id: string;
  nombre: string;
  ruta?: string;
  icono?: string;
  orden?: number;
  menuSuperior?: string | null;
  activo?: boolean;
  nivel?: number;
  children?: MenuItem[];
};

export async function getRootMenus() {
  return adminFetch<MenuItem[]>(`/api/admin/menus/root`, {
    method: 'GET',
  });
}

export async function getMenuTree() {
  return adminFetch<MenuItem[]>(`/api/admin/menus/tree`, {
    method: 'GET',
  });
}

// Auditoría (Administrativo)
export async function trackAdminAudit(payload: {
  entidad: string;
  idEntidad: string;
  accion: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE';
  datosAnteriores?: any;
  datosNuevos?: any;
}) {
  return adminFetch(`/api/admin/auditoria/track`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { BASE_URL, ADMIN_BASE_URL };

// =============== Admin vistas ===============
// Usuarios (desde microservicio de usuarios)
export async function listUsers(params?: { activo?: boolean; idTipoUsuario?: string }) {
  const query = new URLSearchParams();
  if (typeof params?.activo === 'boolean') query.append('activo', String(params.activo));
  if (params?.idTipoUsuario) query.append('idTipoUsuario', params.idTipoUsuario);
  const q = query.toString();
  return apiFetch(`/api/users/usuarios${q ? `?${q}` : ''}`, { method: 'GET' });
}

export async function updateUser(id: string, payload: Partial<{ idTipoUsuario: string; idEstado: string; activo: boolean; telefono?: string }>) {
  return apiFetch(`/api/users/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// Estados (administrativo)
export async function listEstados() {
  return adminFetch(`/api/admin/estados`, { method: 'GET' });
}

// Accesos (administrativo)
export async function listAccesos() {
  return adminFetch(`/api/admin/accesos`, { method: 'GET' });
}

// Get acceso by id
export async function getAccesoById(id: string) {
  return adminFetch(`/api/admin/accesos/${id}`, { method: 'GET' });
}

// Create acceso-usuario (registra envío/estado de verificación)
export async function createAccesoUsuario(payload: { usuarioId: string; accesoId: string; fechaAsignacion?: string; activo?: boolean }) {
  return adminFetch(`/api/admin/accesosusuario`, { method: 'POST', body: JSON.stringify(payload) });
}
export async function createAcceso(payload: { nombre: string; codigo: string; scope?: string; visible?: boolean }) {
  return adminFetch(`/api/admin/accesos`, { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateAcceso(id: string, payload: Partial<{ nombre: string; codigo: string; scope?: string; visible?: boolean }>) {
  return adminFetch(`/api/admin/accesos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}
export async function deleteAcceso(id: string) {
  return adminFetch(`/api/admin/accesos/${id}`, { method: 'DELETE' });
}

// Notificaciones (administrativo)
export async function listNotificaciones() {
  return adminFetch(`/api/admin/notificaciones`, { method: 'GET' });
}
export async function createNotificacion(payload: { titulo?: string; asunto?: string; destinatario?: string; tipo?: string; visible?: boolean; contenido?: string }) {
  return adminFetch(`/api/admin/notificaciones`, { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateNotificacion(id: string, payload: Partial<{ titulo?: string; asunto?: string; destinatario?: string; tipo?: string; visible?: boolean; contenido?: string }>) {
  return adminFetch(`/api/admin/notificaciones/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}
export async function deleteNotificacion(id: string) {
  return adminFetch(`/api/admin/notificaciones/${id}`, { method: 'DELETE' });
}

// Tipos de Usuario (usuarios)
export async function listTiposUsuario() {
  return apiFetch(`/api/users/tiposusuarios`, { method: 'GET' });
}

// Estados (administrativo) CRUD y filtros
export async function filterEstados(params: { nombre?: string; simbolo?: string; modulo?: string; visible?: boolean }) {
  const query = new URLSearchParams();
  if (params?.nombre) query.append('nombre', params.nombre);
  if (params?.simbolo) query.append('simbolo', params.simbolo);
  if (params?.modulo) query.append('modulo', params.modulo);
  if (typeof params?.visible === 'boolean') query.append('visible', String(params.visible));
  return adminFetch(`/api/admin/estados?${query.toString()}`, { method: 'GET' });
}

export async function createEstado(payload: { codigo: string; nombre: string; color?: string; simbolo?: string; descripcion?: string; visible?: boolean; modulo?: string; }) {
  return adminFetch(`/api/admin/estados`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateEstado(id: string, payload: Partial<{ codigo: string; nombre: string; color?: string; simbolo?: string; descripcion?: string; visible?: boolean; modulo?: string; }>) {
  return adminFetch(`/api/admin/estados/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteEstado(id: string) {
  return adminFetch(`/api/admin/estados/${id}`, { method: 'DELETE' });
}
