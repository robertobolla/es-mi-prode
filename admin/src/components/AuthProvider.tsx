'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
  avatarUrl?: string | null;
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('es-AR', { hour12: false });
    console.log(`[AUTH] [${timestamp}] ${msg}`);
    setAuthLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  useEffect(() => {
    addLog('Iniciando AuthProvider...');
    addLog(`Entorno detectado: NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL || 'N/A'}`);
    addLog(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'N/A'}`);

    const diagTimer = setTimeout(() => {
      setShowDiagnostics(true);
      addLog('⚠️ La verificación tardó más de 4 segundos. Mostrando panel de diagnóstico.');
    }, 4000);

    let unsubscribeFn: (() => void) | null = null;
    
    try {
      addLog('Registrando listener de cambios de autenticación (onAuthStateChange)...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          addLog(`onAuthStateChange disparado: Evento=${event}, Sesión activa=${!!session}`);
          if (session) {
            addLog(`Usuario autenticado en Supabase: email=${session.user?.email || 'N/A'}, id=${session.user?.id || 'N/A'}`);
            await checkAdminProfile();
          } else {
            addLog('No se detectó sesión activa en onAuthStateChange.');
            setProfile(null);
            setLoading(false);
          }
          setSessionChecked(true);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          addLog(`❌ Error en callback onAuthStateChange: ${errMsg}`);
          setGlobalError(`Error en onAuthStateChange: ${errMsg}`);
          setLoading(false);
          setSessionChecked(true);
        }
      });
      
      if (subscription) {
        unsubscribeFn = () => {
          addLog('Desuscribiendo listener onAuthStateChange...');
          subscription.unsubscribe();
        };
      }

      addLog('Consultando getSession inicial de Supabase...');
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        try {
          addLog(`getSession resuelto: Sesión activa=${!!session}`);
          if (session) {
            addLog(`Usuario en getSession: email=${session.user?.email || 'N/A'}, id=${session.user?.id || 'N/A'}`);
            await checkAdminProfile();
          } else {
            addLog('No se detectó sesión activa en getSession inicial.');
            setLoading(false);
          }
          setSessionChecked(true);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          addLog(`❌ Error al procesar getSession: ${errMsg}`);
          setGlobalError(`Error en getSession.then: ${errMsg}`);
          setLoading(false);
          setSessionChecked(true);
        }
      }).catch((err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        addLog(`❌ Error crítico en getSession Promise: ${errMsg}`);
        setGlobalError(`Error en getSession Promise: ${errMsg}`);
        setLoading(false);
        setSessionChecked(true);
      });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`❌ Error durante el montaje: ${errMsg}`);
      setGlobalError(`Error en inicialización del useEffect: ${errMsg}`);
      setLoading(false);
      setSessionChecked(true);
    }

    return () => {
      clearTimeout(diagTimer);
      if (unsubscribeFn) unsubscribeFn();
    };
  }, []);

  const checkAdminProfile = async () => {
    try {
      const path = '/users/me';
      const targetUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${path}`;
      addLog(`Validando rol de administrador. Realizando fetch a: ${targetUrl}`);
      
      const res = await apiFetch(path);
      addLog(`Fetch completado. Status HTTP: ${res.status} (${res.statusText || 'N/A'})`);
      
      if (!res.ok) {
        throw new Error(`Servidor backend retornó status ${res.status}: ${res.statusText || 'No autorizado'}`);
      }
      
      const data: UserProfile = await res.json();
      addLog(`Perfil de usuario cargado: username=${data.username}, isAdmin=${data.isAdmin}`);
      
      if (data.isAdmin) {
        addLog('Acceso concedido: Es administrador.');
        setProfile(data);
      } else {
        addLog('Acceso denegado: El usuario no posee privilegios de administrador (isAdmin = false).');
        setProfile(null);
        setAuthError('Acceso denegado: Esta cuenta no tiene privilegios de administrador.');
        addLog('Cerrando sesión de Supabase...');
        await supabase.auth.signOut();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`❌ Error en checkAdminProfile: ${errMsg}`);
      console.error('Error checking admin role:', err);
      setGlobalError(`Error al validar rol de administrador: ${errMsg}`);
      setAuthError('Error de autenticación al validar el rol de administrador.');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error al desloguear de Supabase:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoginLoading(true);

    if (!email.trim() || !password.trim()) {
      setAuthError('Completa todos los campos');
      setLoginLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }
      // El useEffect onAuthStateChange detectará la sesión y llamará a checkAdminProfile
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión con Google');
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
  };

  // ── Pantalla de Error Crítico/Diagnóstico ──
  if (globalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 text-center">
        <span className="text-red-500 text-5xl mb-4">🚨</span>
        <h2 className="text-xl font-bold text-red-400 mb-2">Error de Conectividad o Configuración</h2>
        <p className="text-xs text-slate-400 mb-4 max-w-md">
          El panel no pudo conectarse correctamente al backend o validar tus credenciales de Supabase.
        </p>
        <p className="text-sm text-slate-300 max-w-lg bg-slate-900/80 border border-red-500/20 p-4 rounded-2xl font-mono break-all mb-6">
          {globalError}
        </p>
        <button
          onClick={() => {
            setGlobalError(null);
            setLoading(true);
            setSessionChecked(false);
            window.location.reload();
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/15"
        >
          REINTENTAR / RECARGAR
        </button>
      </div>
    );
  }

  // ── Pantalla de Carga Inicial ──
  if (loading || !sessionChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
          <span className="absolute text-xl">⚽</span>
        </div>
        <p className="text-slate-400 font-medium tracking-wide animate-pulse mb-8">Verificando credenciales...</p>

        {showDiagnostics && (
          <div className="w-full max-w-lg bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-2xl z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500 text-xl">⚙️</span>
              <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase">Logs de Inicialización</h3>
            </div>
            
            <div className="space-y-1.5 font-mono text-[10px] text-slate-300 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/50 max-h-48 overflow-y-auto mb-4 scrollbar-thin">
              {authLogs.length === 0 ? (
                <p className="text-slate-500 italic">No hay logs registrados.</p>
              ) : (
                authLogs.map((log, i) => (
                  <div key={i} className="break-all whitespace-pre-wrap leading-relaxed text-left border-b border-slate-900/50 pb-1 last:border-0 last:pb-0">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl text-[11px] text-yellow-400 leading-relaxed mb-6 text-left">
              💡 <strong>Nota del Servidor:</strong> Si el backend de Render estaba dormido por inactividad, la primera respuesta puede demorar hasta 50 segundos en completarse. Por favor espera o reintenta.
            </div>

            <button
              onClick={() => {
                setGlobalError(null);
                setLoading(true);
                setSessionChecked(false);
                setShowDiagnostics(false);
                setAuthLogs([]);
                window.location.reload();
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-yellow-500/15"
            >
              FORZAR RECARGA DE PÁGINA
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Pantalla de Login (Si no hay perfil de administrador) ──
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Es Mi Prode<span className="text-yellow-500">.Admin</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Inicia sesión para acceder al panel de control</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-3">
              <span className="text-red-500 text-lg mt-0.5">⚠️</span>
              <p className="text-red-400 text-xs font-semibold leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input
                type="email"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-slate-100 rounded-2xl px-4 py-3.5 outline-none transition-all"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginLoading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-slate-100 rounded-2xl px-4 py-3.5 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-slate-950 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-950"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>INGRESAR AL PANEL</span>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-wider">O también</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 border border-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="tracking-wide">CONTINUAR CON GOOGLE</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard Normal (Si es administrador) ──
  return (
    <AuthContext.Provider value={{ profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
