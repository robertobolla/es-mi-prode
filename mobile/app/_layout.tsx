import 'react-native-url-polyfill/auto';
import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, Platform, Alert } from 'react-native';
import Purchases from 'react-native-purchases';

interface ApiError {
  status?: number;
  message?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  gender: string | null;
  dob: string | null;
  isOnboarded: boolean;
}
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments() as string[];
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'MOCK_KEY';
        Purchases.configure({ apiKey });
        console.log('💳 [RevenueCat] SDK configurado');
        ((globalThis as unknown) as { purchasesConfigured?: boolean }).purchasesConfigured = true;
      } catch (err) {
        const error = err as Error;
        console.warn('⚠️ [RevenueCat] Error al configurar Purchases (puede ser por Expo Go):', error.message);
        ((globalThis as unknown) as { purchasesConfigured?: boolean }).purchasesConfigured = false;
      }
    }
  }, []);

  useEffect(() => {
    // 1. Initial Session Check with timeout to prevent hangs
    const checkSession = async () => {
      try {
        console.log('🔍 [RootLayout] Iniciando verificación de sesión...');
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de Supabase')), 2000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.warn('⚠️ [RootLayout] Error en getSession:', error.message);
          // Clear stale tokens to prevent this error on next launch
          await supabase.auth.signOut();
          setSession(null);
          return;
        }

        console.log('📡 [RootLayout] Sesión recuperada:', session ? 'USUARIO LOGUEADO' : 'SIN SESIÓN');
        setSession(session);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn('⚠️ [RootLayout] Fallo en checkSession:', errorMessage);
        // If it's a refresh token error, clean up stored credentials
        if (errorMessage.includes('Refresh Token')) {
          try { await supabase.auth.signOut(); } catch (_) { /* ignore */ }
        }
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
      setSession((prevSession) => {
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
  // Listener global para capturar retornos de OAuth (especialmente útil para es-mi-prode://)
  const url = Linking.useURL();
  useEffect(() => {
    if (url && url.includes('access_token')) {
      const handleOAuthParams = async () => {
        const getParam = (u: string, param: string) => {
          const regex = new RegExp(`[#?&]${param}=([^&]*)`);
          const match = u.match(regex);
          return match ? match[1] : null;
        };

        const access_token = getParam(url, 'access_token');
        const refresh_token = getParam(url, 'refresh_token');

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!error) {
            setSession(data.session); 
          }
        }
      };
      handleOAuthParams();
    }
  }, [url]);

  // Listen to push notification clicks and redirect to correct screen
  useEffect(() => {
    if (!initialized || !rootNavigationState?.key) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('📱 [Push Notification Clicked]', data);

      if (data?.type === 'outrights_reminder' && data?.tournamentId) {
        // Redirect to predictions screen of that tournament, specifically the Clasificados tab
        router.push({
          pathname: `/tournament/${data.tournamentId}/predict`,
          params: { initialTab: 'Clasificados' }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initialized, rootNavigationState?.key]);

  useEffect(() => {
    if (!initialized || !rootNavigationState?.key) return;

    const routeToAppropriateScreen = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const isLoginScreen = segments.length > 1 && segments[1] === 'login';
      const isOnboardingScreen = segments.length > 1 && segments[1] === 'onboarding';

      console.log('🔄 [RootLayout] Navigation State:', {
        segments,
        inAuthGroup,
        isLoginScreen,
        isOnboardingScreen,
        hasSession: !!session,
        email: session?.user?.email
      });

      if (!session) {
        if (!inAuthGroup || isOnboardingScreen) {
          console.log('🔄 [RootLayout] Sin sesión. Redirigiendo a login...');
          router.replace('/(auth)/login');
        }
        return;
      }

      // Si tenemos sesión y NO estamos ya en onboarding, comprobamos el perfil
      if (!isOnboardingScreen) {
        try {
          const { api, API_URL } = await import('../lib/api');
          console.log('📡 [RootLayout] Intentando conectar a:', API_URL);
          const userData = (await api.get('/users/me')) as UserProfile;
          console.log('👤 [RootLayout] Perfil de usuario obtenido:', {
            id: userData?.id,
            username: userData?.username,
            country: userData?.country,
            dob: userData?.dob,
            isOnboarded: userData?.isOnboarded
          });
          
          // Register for push notifications silently if permission is already granted
          if (Device.isDevice) {
            const { status } = await Notifications.getPermissionsAsync();
            if (status === 'granted') {
              const token = await registerForPushNotificationsAsync();
              if (token) {
                try {
                  await api.patch('/users/me', { pushToken: token });
                  console.log('📱 [Push] Token guardado en DB');
                } catch (err) {
                  console.log('❌ [Push] Error guardando token', err);
                }
              }
            }
          }
          
          // Si no completó onboarding, redirigir a onboarding
          if (userData && !userData.isOnboarded) {
            console.log('🔄 [RootLayout] Usuario no completó onboarding. Redirigiendo a onboarding...');
            router.replace('/(auth)/onboarding');
          } else if (inAuthGroup) {
            console.log('🔄 [RootLayout] Usuario completó onboarding y está en grupo auth. Redirigiendo a tabs...');
            router.replace('/(tabs)');
          }
        } catch (err) {
          const error = err as ApiError;
          console.error('❌ [RootLayout] Error al obtener perfil:', error.status || 'SIN_STATUS', error.message || 'Unknown error');

          
          if (error.status === 401) {
            console.log('🔄 [RootLayout] Token inválido o expirado. Cerrando sesión local...');
            try {
              await supabase.auth.signOut();
            } catch (_) { /* ignore */ }
            setSession(null);
            router.replace('/(auth)/login');
          } else if (error.status === 404) {
            // El usuario no tiene perfil, lo mandamos al onboarding
            router.replace('/(auth)/onboarding');
          } else {
            // Si el servidor está apagado o falla (timeout), lo dejamos entrar por ahora (Desarrollo).
            if (inAuthGroup) {
              console.log('⚠️ [RootLayout] Backend inalcanzable, permitiendo acceso offline temporal.');
              router.replace('/(tabs)');
            }
          }
        }
      }
    };

    routeToAppropriateScreen();
  }, [session, initialized, segments, rootNavigationState?.key]);

  // registerForPushNotificationsAsync imported from lib/notifications

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EAB308" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tournament" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}
