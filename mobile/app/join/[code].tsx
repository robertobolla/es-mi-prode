import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface TournamentDetails {
  id: string;
  name: string;
  isPublic: boolean;
  competition?: {
    name: string;
  } | null;
  _count?: {
    members: number;
  };
}

export default function JoinTournamentScreen() {
  const { code } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchTournamentDetails();
  }, [code]);

  const fetchTournamentDetails = async () => {
    if (!code) {
      setError('Código no válido');
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert(
          'Iniciá Sesión',
          'Tenés que estar logueado para unirte a un torneo.',
          [
            { text: 'Ir al Login', onPress: () => router.replace('/(auth)/login') },
            { text: 'Cerrar', style: 'cancel', onPress: () => router.replace('/') }
          ]
        );
        return;
      }

      // 2. Obtener detalles del torneo por código
      const data = await api.get(`/tournaments/code/${code}`);
      if (!data) {
        setError('Torneo no encontrado. Verificá el código.');
      } else {
        setTournament(data as TournamentDetails);
      }
    } catch (err) {
      const e = err as Error;
      console.error('Error al obtener info del torneo:', e);
      setError(e.message || 'Error al cargar información del torneo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (tournament && !tournament.isPublic && !password.trim()) {
      Alert.alert('Error', 'La contraseña es obligatoria para ingresar a este torneo.');
      return;
    }

    setJoining(true);
    try {
      console.log(`🔗 Uniéndose al torneo: ${code}`);
      const result = await api.post('/tournaments/join', { 
        shareCode: code as string,
        password: tournament && !tournament.isPublic ? password.trim() : undefined
      }) as { tournamentId?: string };
      
      if (result && result.tournamentId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace(`/tournament/${result.tournamentId}`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/(tabs)');
      }
    } catch (err) {
      const e = err as Error;
      console.error('Error al unirse:', e);
      if (e.message?.includes('already joined')) {
        Alert.alert('Aviso', 'Ya sos parte de este torneo.', [
          { text: 'Ir al Torneo', onPress: () => router.replace(`/tournament/${tournament?.id}`) }
        ]);
      } else if (e.message?.includes('Invalid password')) {
        Alert.alert('Error', 'Contraseña incorrecta. Por favor reintentá.');
      } else {
        Alert.alert('Error', e.message || 'No se pudo unir al torneo');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.scrollContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
        <Text style={styles.loadingText}>Buscando torneo...</Text>
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View style={styles.scrollContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
        <Text style={styles.errorText}>{error || 'Torneo no disponible'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>VOLVER AL INICIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name={tournament.isPublic ? "trophy-outline" : "lock-closed-outline"} size={48} color="#EAB308" />
            </View>
            
            <Text style={styles.title}>
              {tournament.isPublic ? '¿Querés unirte a este torneo?' : 'Unirse a torneo privado'}
            </Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <Text style={styles.competitionName}>{tournament.competition?.name || 'Torneo Personalizado'}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color="#94A3B8" />
                  <Text style={styles.metaText}>{tournament._count?.members || 0} jugadores</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="key-outline" size={16} color="#94A3B8" />
                  <Text style={styles.metaText}>Código: {code}</Text>
                </View>
              </View>
            </View>

            {!tournament.isPublic && (
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Este torneo es privado. Ingresá la contraseña:</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Contraseña"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.cancelBtn, joining && { opacity: 0.5 }]} 
                onPress={() => router.replace('/')}
                disabled={joining}
              >
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmBtn, joining && { opacity: 0.8 }]} 
                onPress={handleConfirmJoin}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#422006" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>UNIRME</Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EAB308',
    textAlign: 'center',
  },
  competitionName: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#64748B',
    fontSize: 13,
  },
  passwordContainer: {
    width: '100%',
    marginBottom: 24,
  },
  passwordLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '900',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    shadowColor: '#EAB308',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 14,
  },
});
