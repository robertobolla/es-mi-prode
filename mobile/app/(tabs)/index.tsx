import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

interface AvailableTournament {
  id: string;
  name: string;
  shareCode: string;
  isCustom: boolean;
  isPublic: boolean;
  _count: {
    members: number;
  };
}

const { width } = Dimensions.get('window');

// Gravatar URL from email (MD5 hash)
function getGravatarUrl(email: string, size = 200) {
  const hash = email?.trim().toLowerCase() || '';
  return `https://www.gravatar.com/avatar/${simpleHash(hash)}?s=${size}&d=identicon`;
}

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [availableTournaments, setAvailableTournaments] = useState<AvailableTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, OFFICIAL, CUSTOM
  const [minPlayers, setMinPlayers] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      console.log('🔔 [Notifications] Estado actual del permiso en el dispositivo:', status);
      
      // En Expo Go o simuladores el permiso suele estar pre-aprobado a nivel de sistema.
      // Cambiá esta variable a `true` si querés forzar la visualización de la tarjeta para pruebas.
      const forceShowForTesting = false; 

      if (status !== 'granted' || forceShowForTesting) {
        setShowNotificationPrompt(true);
      }
    } catch (e) {
      console.warn('Error checking notifications permission', e);
    }
  };

  const handleRequestPush = async () => {
    setShowNotificationPrompt(false);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await api.patch('/users/me', { pushToken: token });
        console.log('📱 [Push] Token guardado en DB');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (e) {
      console.log('Error requesting push permission', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchAvailable();
    }, [])
  );

  const fetchData = async () => {
    try {
      const profileData = await api.get('/users/me').catch(() => null);
      setProfile(profileData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailable = async () => {
    setLoadingAvailable(true);
    try {
      let url = `/tournaments/available?name=${encodeURIComponent(searchTerm)}`;
      if (filterType === 'OFFICIAL') url += '&isCustom=false';
      if (filterType === 'CUSTOM') url += '&isCustom=true';
      if (minPlayers) url += `&minPlayers=${minPlayers}`;
      if (maxPlayers) url += `&maxPlayers=${maxPlayers}`;

      const data = await api.get(url);
      setAvailableTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSearch = () => {
    fetchAvailable();
  };

  // Removed direct joinTournament function in favor of dedicated /join/[code] routing

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  const displayName = profile?.fullName?.split(' ')[0] || profile?.username || 'Leyenda';
  const initial = displayName.charAt(0).toUpperCase();

  const avatarSource = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : { uri: getGravatarUrl(profile?.email || '') };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#020617' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Premium Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {displayName} 👋</Text>
            <Text style={styles.pointsLabel}>PUNTUACIÓN GLOBAL</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.points}>
                {profile?.historicalPoints || 0} <Text style={styles.pointsSpan}>PTS</Text>
              </Text>
              {profile?.globalRank !== undefined && (
                <Text style={styles.globalRankText}>#{profile.globalRank}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.avatarGlass}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {profile?.avatarUrl || profile?.email ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Notification Opt-In Banner */}
        {showNotificationPrompt && (
          <View style={styles.notificationBanner}>
            <LinearGradient
              colors={['rgba(234, 179, 8, 0.15)', 'rgba(234, 179, 8, 0.05)']}
              style={styles.notificationBannerGradient}
            >
              <View style={styles.notificationBannerHeader}>
                <View style={styles.notificationIconBg}>
                  <Text style={{ fontSize: 20 }}>🔔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationBannerTitle}>¡No te pierdas de nada!</Text>
                  <Text style={styles.notificationBannerDesc}>
                    Activá las alertas para recordar tus pronósticos antes de cada partido y no perder puntos.
                  </Text>
                </View>
              </View>
              <View style={styles.notificationBannerButtons}>
                <TouchableOpacity 
                  style={styles.notificationCancelBtn}
                  onPress={() => setShowNotificationPrompt(false)}
                >
                  <Text style={styles.notificationCancelBtnText}>Más tarde</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.notificationAcceptBtn}
                  onPress={handleRequestPush}
                >
                  <Text style={styles.notificationAcceptBtnText}>Activar</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}



        {/* EXPLORE SECTION */}
        <View style={[styles.section, { marginTop: 24, paddingBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EXPLORAR TORNEOS</Text>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Text style={styles.filterToggleText}>{showFilters ? 'Ocultar Filtros' : 'Filtros'}</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Text style={{ marginRight: 8 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre..."
                placeholderTextColor="#64748B"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>BUSCAR</Text>
            </TouchableOpacity>
          </View>

          {/* Filters Panel */}
          {showFilters && (
            <View style={styles.filtersPanel}>
              <Text style={styles.filterLabel}>Tipo de Competición</Text>
              <View style={styles.filterChips}>
                {['ALL', 'OFFICIAL', 'CUSTOM'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.filterChip, filterType === type && styles.activeChip]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text style={[styles.filterChipText, filterType === type && styles.activeChipText]}>
                      {type === 'ALL' ? 'Todos' : type === 'OFFICIAL' ? 'Oficiales' : 'Personalizados'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.playersFilterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterLabel}>Mín. Jugadores</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Ej: 5"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={minPlayers}
                    onChangeText={setMinPlayers}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterLabel}>Máx. Jugadores</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Ej: 50"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={maxPlayers}
                    onChangeText={setMaxPlayers}
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.applyFiltersBtn} onPress={fetchAvailable}>
                <Text style={styles.applyFiltersBtnText}>APLICAR FILTROS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Available List */}
          {loadingAvailable ? (
            <ActivityIndicator color="#EAB308" style={{ marginTop: 20 }} />
          ) : (availableTournaments?.length || 0) === 0 ? (
            <View style={styles.noResultsCard}>
              <Text style={styles.noResultsText}>No se encontraron torneos disponibles</Text>
            </View>
          ) : (
            <View style={styles.availableList}>
              {availableTournaments?.map((t: AvailableTournament) => (
                <View key={t.id} style={styles.availableItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.availableName}>{t.name}</Text>
                    <Text style={styles.availableInfo}>
                      {t.isCustom ? '👤 Personalizado' : '🏅 Oficial'} • {t._count.members} jugadores • {t.isPublic ? '🔓 Público' : '🔒 Privado'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.joinBtn}
                    onPress={() => router.push(`/join/${t.shareCode}`)}
                  >
                    <Text style={styles.joinBtnText}>UNIRME</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0F172A',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: -4,
  },
  points: {
    fontSize: 36,
    fontWeight: '900',
    color: '#EAB308',
  },
  pointsSpan: {
    fontSize: 18,
    color: '#EAB308',
  },
  globalRankText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 8,
  },
  avatarGlass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggleText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#EAB308',
    marginLeft: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 12,
  },
  filtersPanel: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeChip: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderColor: '#EAB308',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
  },
  activeChipText: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
  playersFilterRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  filterInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  applyFiltersBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFiltersBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  availableList: {
    gap: 12,
  },
  availableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  availableName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  availableInfo: {
    color: '#64748B',
    fontSize: 12,
  },
  joinBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noResultsCard: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
  notificationBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  notificationBannerGradient: {
    padding: 18,
  },
  notificationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBannerTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  notificationBannerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  notificationBannerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  notificationCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notificationCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationAcceptBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#EAB308',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  notificationAcceptBtnText: {
    color: '#422006',
    fontSize: 12,
    fontWeight: '900',
  },
});
