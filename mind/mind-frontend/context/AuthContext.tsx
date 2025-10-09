import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken as loadToken, saveToken as persistToken, clearToken as purgeToken } from '../services/auth';

type AuthContextValue = {
  token: string | null;
  loading: boolean;
  setToken: (t: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await loadToken();
        if (!mounted) return;
        setTokenState(t);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setToken = useCallback(async (t: string | null) => {
    if (t) await persistToken(t); else await purgeToken();
    setTokenState(t);
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
  }, [setToken]);

  const value = useMemo(() => ({ token, loading, setToken, logout }), [token, loading, setToken, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
