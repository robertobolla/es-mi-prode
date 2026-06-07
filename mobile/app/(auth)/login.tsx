import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, Alert, ScrollView, Modal } from 'react-native';
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
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Por favor ingresá tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: 'es-mi-prode://login',
      });
      if (error) throw error;
      Alert.alert(
        'Correo enviado',
        'Te enviamos un enlace de recuperación a tu correo electrónico. Al hacer clic en el enlace, iniciarás sesión automáticamente en la aplicación y podrás cambiar tu contraseña en tu Perfil.'
      );
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Usamos el esquema nativo que ya sabemos que Google y Supabase aceptan
      const redirectUrl = 'es-mi-prode://login';
      console.log('🔗 [DEBUG] Usando esquema nativo para retorno:', redirectUrl);
      
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
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (res.type === 'success' && res.url) {
          const getParam = (url: string, param: string) => {
            const regex = new RegExp(`[#?&]${param}=([^&]*)`);
            const match = url.match(regex);
            return match ? match[1] : null;
          };

          const access_token = getParam(res.url, 'access_token');
          const refresh_token = getParam(res.url, 'refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) throw sessionError;
            // Keep loading = true, let _layout.tsx handle the redirection
            return;
          }
        }
      }
      setLoading(false);
    } catch (error) {
      const err = error as Error;
      console.error('❌ [OAuth] Error crítico:', err);
      Alert.alert('Error', err.message || 'Error desconocido');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const redirectUrl = 'es-mi-prode://login';
      console.log('🔗 [DEBUG] Usando esquema nativo para retorno (Apple):', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('❌ [OAuth] Error de Supabase (Apple):', error);
        throw error;
      }

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (res.type === 'success' && res.url) {
          const getParam = (url: string, param: string) => {
            const regex = new RegExp(`[#?&]${param}=([^&]*)`);
            const match = url.match(regex);
            return match ? match[1] : null;
          };

          const access_token = getParam(res.url, 'access_token');
          const refresh_token = getParam(res.url, 'refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) throw sessionError;
            // Keep loading = true, let _layout.tsx handle the redirection
            return;
          }
        }
      }
      setLoading(false);
    } catch (error) {
      const err = error as Error;
      console.error('❌ [OAuth] Error crítico (Apple):', err);
      Alert.alert('Error', err.message || 'Error desconocido al conectar con Apple');
      setLoading(false);
    }
  };

  // El login se maneja directamente en handleGoogleLogin via WebBrowser.openAuthSessionAsync

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresá tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Keep loading = true, let _layout.tsx handle the redirection
      return;
    } catch (error) {
      const err = error as Error;

      // Supabase devuelve este mensaje cuando el email no fue confirmado
      if (err.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email sin confirmar',
          'Tenés que confirmar tu correo electrónico antes de iniciar sesión. ¿Querés que te reenviemos el email de verificación?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Reenviar email',
              onPress: async () => {
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email,
                });
                if (resendError) {
                  Alert.alert('Error', 'No se pudo reenviar el email. Intentá más tarde.');
                } else {
                  Alert.alert('¡Listo!', 'Te reenviamos el email de confirmación. Revisá tu bandeja de entrada.');
                }
              },
            },
          ]
        );
      } else if (err.message.toLowerCase().includes('invalid login credentials')) {
        Alert.alert('Error', 'Email o contraseña incorrectos.');
      } else {
        Alert.alert('Error', err.message);
      }

      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Decorators */}
      <View style={styles.bgCircle1} pointerEvents="none" />
      <View style={styles.bgCircle2} pointerEvents="none" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              
              <TouchableOpacity style={styles.socialBtn} disabled={loading} onPress={handleAppleLogin}>
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
              style={styles.forgotBtn} 
              onPress={() => setShowForgotModal(true)}
              disabled={loading}
            >
              <Text style={styles.forgotBtnText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleEmailLogin}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>{loading ? 'CARGANDO...' : 'ENTRAR AL MUNDO'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerText}>¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate aquí</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal para restablecer contraseña */}
      <Modal visible={showForgotModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Restablecer Contraseña</Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Ingresá tu correo electrónico registrado y te enviaremos un enlace para que puedas volver a entrar a tu cuenta.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Correo electrónico"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />

            <TouchableOpacity 
              style={styles.modalPrimaryBtn} 
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Very dark slate (nearly black)
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotBtnText: {
    color: '#EAB308',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalDescription: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 16,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#422006',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
