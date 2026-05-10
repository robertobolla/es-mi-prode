import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments() as string[];
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Initial Session Check with timeout to prevent hangs
    const checkSession = async () => {
      try {
        console.log('🔍 [RootLayout] Iniciando verificación de sesión...');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de Supabase')), 2000)
        );
        
        const { data: { session } } : any = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log('📡 [RootLayout] Sesión recuperada:', session ? 'USUARIO LOGUEADO' : 'SIN SESIÓN');
        setSession(session);
      } catch (e) {
        console.warn('Fallo en checkSession (probablemente timeout o storage nulo):', e);
        setSession(null);
      } finally {
        setInitialized(true);
      }
    };

    checkSession();

    // 2. Auth Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Prevención CLAVE de re-renders infinitos:
      // Supabase a veces dispara este evento en bucle si hay problemas menores de almacenamiento.
      // Solo actualizamos el estado si el token real ha cambiado.
      setSession((prevSession: any) => {
        if (prevSession?.access_token === newSession?.access_token) {
          return prevSession; // No cambies la referencia, aborta el re-render
        }
        return newSession;
      });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Run once on mount

  // 3. Navigation Guard
  useEffect(() => {
    if (!initialized || !rootNavigationState?.key) return;

    const routeToAppropriateScreen = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const isLoginScreen = segments.length > 1 && segments[1] === 'login';
      const isOnboardingScreen = segments.length > 1 && segments[1] === 'onboarding';

      if (!session) {
        if (!inAuthGroup || isOnboardingScreen) {
          router.replace('/(auth)/login');
        }
        return;
      }

      // Si tenemos sesión, comprobamos el perfil en el backend
      try {
        const { api, API_URL } = await import('../lib/api');
        console.log('📡 [RootLayout] Intentando conectar a:', API_URL);
        await api.get('/users/me');
        
        // Si no dio error 404, el perfil existe.
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (error: any) {
        console.error('❌ [RootLayout] Error al obtener perfil:', error.status || 'SIN_STATUS', error.message);
        
        if (error.status === 404) {
          // El usuario no tiene perfil, lo mandamos al onboarding
          if (!isOnboardingScreen) {
            router.replace('/(auth)/onboarding');
          }
        } else {
          // Si el servidor está apagado o falla (timeout), lo dejamos entrar por ahora (Desarrollo).
          // Pero NO lo sacamos si ya está en la pantalla de onboarding llenando sus datos.
          if (inAuthGroup && !isOnboardingScreen) {
            console.log('⚠️ [RootLayout] Backend inalcanzable, permitiendo acceso offline temporal.');
            router.replace('/(tabs)');
          }
        }
      }
    };

    routeToAppropriateScreen();
  }, [session, initialized, segments, rootNavigationState?.key]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAB308" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tournament" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
