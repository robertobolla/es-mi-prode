import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, OFFICIAL, CUSTOM
  const [minPlayers, setMinPlayers] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');

  useEffect(() => {
    fetchData();
    fetchAvailable();
  }, []);

  const fetchData = async () => {
    try {
      const [profileData, tournamentsData] = await Promise.all([
        api.get('/users/me').catch(() => null),
        api.get('/tournaments/my').catch(() => []),
      ]);
      setProfile(profileData);
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailable = async () => {
    setLoadingAvailable(true);
    try {
      let url = `/tournaments/available?name=${searchTerm}`;
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

  const joinTournament = async (shareCode: string) => {
    try {
      await api.post('/tournaments/join', { shareCode });
      // Refresh data
      fetchData();
      fetchAvailable();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error al unirse al torneo');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  const displayName = profile?.fullName?.split(' ')[0] || profile?.username || 'Leyenda';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {displayName} 👋</Text>
          <Text style={styles.pointsLabel}>PUNTUACIÓN GLOBAL</Text>
          <Text style={styles.points}>{profile?.historicalPoints || 0} <Text style={styles.pointsSpan}>PTS</Text></Text>
        </View>
        <View style={styles.avatarGlass}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      {/* Active Tournaments (Real Data) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TUS TORNEOS ACTIVOS</Text>
        
        {tournaments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>Aún no participas en ningún torneo</Text>
            <TouchableOpacity 
              style={styles.goToTournamentsBtn}
              onPress={() => router.push('/(tabs)/tournaments')}
            >
              <Text style={styles.goToTournamentsBtnText}>IR A TORNEOS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {tournaments.map((t: any, index: number) => (
              <TouchableOpacity 
                key={t.id} 
                style={[styles.tournamentCard, index > 0 && { marginLeft: 16 }]}
                onPress={() => router.push(`/tournament/${t.id}`)}
              >
                {t.myRank && (
                  <View style={[styles.tBadge, t.myRank > 3 && { backgroundColor: '#475569' }]}>
                    <Text style={styles.tBadgeText}>
                      {t.myRank === 1 ? '🏆 1ro' : t.myRank === 2 ? '🥈 2do' : t.myRank === 3 ? '🥉 3ro' : `${t.myRank}to`}
                    </Text>
                  </View>
                )}
                <Text style={styles.tournamentName}>{t.name}</Text>
                <View style={styles.tStatsDivider} />
                <Text style={styles.tournamentScore}>Tus Puntos: <Text style={styles.goldText}>{t.myPoints || 0}</Text></Text>
                <Text style={styles.tournamentInfo}>Participantes: {t.memberCount || 0}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

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
            {availableTournaments?.map((t: any) => (
              <View key={t.id} style={styles.availableItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.availableName}>{t.name}</Text>
                  <Text style={styles.availableInfo}>
                    {t.isCustom ? '👤 Personalizado' : '🏅 Oficial'} • {t._count.members} jugadores
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.joinBtn}
                  onPress={() => joinTournament(t.shareCode)}
                >
                  <Text style={styles.joinBtnText}>UNIRME</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

    </ScrollView>
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
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  goToTournamentsBtn: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToTournamentsBtnText: {
    color: '#422006',
    fontWeight: '900',
    letterSpacing: 1,
  },
  carousel: {
    overflow: 'visible',
  },
  tournamentCard: {
    width: width * 0.7,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#EAB308',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#EAB308',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  tBadgeText: {
    color: '#422006',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12,
    paddingTop: 8,
  },
  tStatsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  tournamentScore: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  goldText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tournamentInfo: {
    color: '#64748B',
    fontSize: 12,
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
});
