import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// Fallbacks de almacenamiento: SecureStore -> localStorage (web) -> memoria
function webLocalStorageAvailable() {
  if (Platform.OS !== 'web') return false;
  try {
    const k = '__mind_ls_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    // Fallback web persistente
    if (webLocalStorageAvailable()) {
      try { window.localStorage.setItem(TOKEN_KEY, token); } catch {}
    } else {
      console.warn('No se pudo guardar el token de forma segura, fallback a memoria. Error:', e);
      // Como fallback, almacenamos en memoria (no persistente)
      inMemory.token = token;
    }
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    if (t) return t;
  } catch {
    // ignore
  }
  // Fallback web persistente
  if (webLocalStorageAvailable()) {
    try { return window.localStorage.getItem(TOKEN_KEY); } catch {}
  }
  return inMemory.token;
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
  // limpiar web
  if (webLocalStorageAvailable()) {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
  }
  inMemory.token = null;
}

const inMemory: { token: string | null } = { token: null };
