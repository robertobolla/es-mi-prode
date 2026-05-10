import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Retornamos directamente a la pantalla de login para atrapar el token
      const redirectUrl = AuthSession.makeRedirectUri({ path: '/(auth)/login' });
      console.log('🔗 [OAuth] URL generada por AuthSession:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('❌ [OAuth] Error de Supabase:', error);
        throw error;
      }

      if (data?.url) {
        console.log('🌐 [OAuth] URL devuelta por Supabase para abrir en navegador:', data.url);
        
        // Abrimos el navegador interno de la app. 
        // Cuando Google termine, redirige a redirectUrl, y WebBrowser lo atrapa y nos devuelve el link.
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (res.type === 'success') {
          console.log('🔗 [OAuth] AuthSession exitoso, atrapó URL:', res.url);
          const params = new URLSearchParams(res.url.split('#')[1] || '');
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
            
            console.log('✅ Sesión establecida correctamente via WebBrowser');
          } else {
            console.warn('⚠️ No se encontraron tokens en la URL de retorno');
          }
        } else {
          console.log('⚠️ [OAuth] Usuario canceló o cerró el navegador:', res.type);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Capturar el enlace de retorno si ocurre (Deep Linking)
  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      console.log('🔗 Deep Link detectado:', url);
      const handleDeepLink = async () => {
        try {
          if (url.includes('access_token') && url.includes('refresh_token')) {
            setLoading(true);
            const params = new URLSearchParams(url.split('#')[1] || '');
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) throw error;
              console.log('✅ Sesión establecida correctamente via Deep Link');
              router.replace('/(tabs)');
            }
          }
        } catch (e: any) {
          Alert.alert('Error de Sesión', e.message);
        } finally {
          setLoading(false);
        }
      };
      handleDeepLink();
    }
  }, [url]);

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decorators */}
      <View style={styles.bgCircle1} pointerEvents="none" />
      <View style={styles.bgCircle2} pointerEvents="none" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ES MI PRODE</Text>
          <Text style={styles.subtitle}>Compite, predice y conviértete en la leyenda de tus amigos.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialBtn} 
              onPress={handleGoogleLogin} 
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#F8FAFC" />
              <Text style={styles.socialBtnText}>{loading ? 'Abriendo...' : 'Google'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.socialBtn} disabled={loading} onPress={() => Alert.alert('Apple', 'Proximamente')}>
              <Ionicons name="logo-apple" size={20} color="#F8FAFC" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o con tu correo</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'CARGANDO...' : 'ENTRAR AL MUNDO'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => Alert.alert('Info', 'Registro pendiente de implementar')}>
            <Text style={styles.registerText}>¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate aquí</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Very dark slate (nearly black)
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: '#1E1B4B', // Deep Indigo
    top: -width * 0.5,
    left: -width * 0.2,
    opacity: 0.6,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: '#0F172A', // Slate
    bottom: -width * 0.4,
    right: -width * 0.3,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(234, 179, 8, 0.5)', // Gold glow
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 24,
    textAlign: 'center',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  socialBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 16,
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate 900
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: '#EAB308', // Gold
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#EAB308',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#422006', // Dark Brown/Gold contrast
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
});
