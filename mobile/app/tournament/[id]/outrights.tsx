import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput, FlatList, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  teamId: string;
  teamName: string;
  flagUrl?: string;
}

interface OutrightPredictionDetail {
  id: string;
  mvpId: string | null;
  mvp: Player | null;
  topScorerId: string | null;
  topScorer: Player | null;
  goalkeeperId: string | null;
  goalkeeper: Player | null;
}

interface OutrightsResponse {
  competitionId: string | null;
  predictMvp: boolean;
  predictTopScorer: boolean;
  predictGoalkeeper: boolean;
  prediction: OutrightPredictionDetail | null;
}

export default function OutrightsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [predictMvp, setPredictMvp] = useState(false);
  const [predictTopScorer, setPredictTopScorer] = useState(false);
  const [predictGoalkeeper, setPredictGoalkeeper] = useState(false);

  const [selectedMvp, setSelectedMvp] = useState<Player | null>(null);
  const [selectedTopScorer, setSelectedTopScorer] = useState<Player | null>(null);
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState<Player | null>(null);

  // Search Modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchType, setSearchType] = useState<'MVP' | 'SCORER' | 'GK'>('MVP');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchOutrights();
  }, [id]);

  const fetchOutrights = async () => {
    try {
      const data: OutrightsResponse = await api.get(`/predictions/tournament/${id}/outrights`);
      setCompetitionId(data.competitionId);
      setPredictMvp(data.predictMvp);
      setPredictTopScorer(data.predictTopScorer);
      setPredictGoalkeeper(data.predictGoalkeeper);

      if (data.prediction) {
        setSelectedMvp(data.prediction.mvp);
        setSelectedTopScorer(data.prediction.topScorer);
        setSelectedGoalkeeper(data.prediction.goalkeeper);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las predicciones especiales');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSearch = (type: 'MVP' | 'SCORER' | 'GK') => {
    setSearchType(type);
    setSearchQuery('');
    setSearchResults([]);
    setSearchModalVisible(true);
    // Initial fetch with empty query to load some players
    triggerSearch('', type);
  };

  const triggerSearch = async (query: string, type: 'MVP' | 'SCORER' | 'GK') => {
    if (!competitionId) return;
    setSearching(true);
    try {
      const positionFilter = type === 'GK' ? 'GK' : undefined;
      let endpoint = `/competitions/${competitionId}/players?`;
      const queryParams: string[] = [];
      if (query) {
        queryParams.push(`search=${encodeURIComponent(query)}`);
      }
      if (positionFilter) {
        queryParams.push(`position=${encodeURIComponent(positionFilter)}`);
      }
      endpoint += queryParams.join('&');

      const response: Player[] = await api.get(endpoint);
      setSearchResults(response);
    } catch (error: any) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    triggerSearch(text, searchType);
  };

  const handleSelectPlayer = (player: Player) => {
    if (searchType === 'MVP') {
      setSelectedMvp(player);
    } else if (searchType === 'SCORER') {
      setSelectedTopScorer(player);
    } else if (searchType === 'GK') {
      setSelectedGoalkeeper(player);
    }
    setSearchModalVisible(false);
  };

  const handleClearSelection = (type: 'MVP' | 'SCORER' | 'GK') => {
    if (type === 'MVP') setSelectedMvp(null);
    if (type === 'SCORER') setSelectedTopScorer(null);
    if (type === 'GK') setSelectedGoalkeeper(null);
  };

  const handleSaveOutrights = async () => {
    if (!competitionId) return;
    setSaving(true);
    try {
      await api.post('/predictions/outrights', {
        competitionId,
        mvpId: selectedMvp?.id || null,
        topScorerId: selectedTopScorer?.id || null,
        goalkeeperId: selectedGoalkeeper?.id || null,
      });
      Alert.alert('¡Éxito!', 'Tus predicciones especiales se guardaron correctamente');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron guardar las predicciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  const noOptionsEnabled = !predictMvp && !predictTopScorer && !predictGoalkeeper;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Predicciones Especiales</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {noOptionsEnabled ? (
          <Text style={styles.infoText}>Este torneo no tiene activas las predicciones especiales en sus reglas.</Text>
        ) : (
          <View style={{ gap: 24 }}>
            <Text style={styles.subtitle}>Elegí tus candidatos para el mundial. Podés cambiarlos hasta el inicio del primer partido.</Text>

            {/* MVP Card */}
            {predictMvp && (
              <PredictionCard
                title="Mejor Jugador (MVP)"
                subtitle="El jugador más valioso de la competencia"
                icon="trophy-outline"
                player={selectedMvp}
                onPress={() => handleOpenSearch('MVP')}
                onClear={() => handleClearSelection('MVP')}
              />
            )}

            {/* Top Scorer Card */}
            {predictTopScorer && (
              <PredictionCard
                title="Goleador del Torneo"
                subtitle="El máximo anotador de goles del mundial"
                icon="football-outline"
                player={selectedTopScorer}
                onPress={() => handleOpenSearch('SCORER')}
                onClear={() => handleClearSelection('SCORER')}
              />
            )}

            {/* Goalkeeper Card */}
            {predictGoalkeeper && (
              <PredictionCard
                title="Mejor Arquero"
                subtitle="El arquero con la valla menos vencida o destacado"
                icon="hand-right-outline"
                player={selectedGoalkeeper}
                onPress={() => handleOpenSearch('GK')}
                onClear={() => handleClearSelection('GK')}
              />
            )}

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.disabledBtn]} 
              onPress={handleSaveOutrights}
              disabled={saving}
            >
              <LinearGradient colors={['#EAB308', '#CA8A04']} style={styles.saveGradient}>
                {saving ? (
                  <ActivityIndicator size="small" color="#422006" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#422006" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>GUARDAR PREDICCIONES</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* SEARCH MODAL */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#0F172A', '#020617']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {searchType === 'MVP' ? 'Buscar MVP' : searchType === 'SCORER' ? 'Buscar Goleador' : 'Buscar Arquero'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSearchModalVisible(false)}>
              <Ionicons name="close" size={24} color="#F8FAFC" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o apellido..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
            />
          </View>

          {searching ? (
            <View style={styles.modalCentered}>
              <ActivityIndicator size="large" color="#EAB308" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.playerItem} onPress={() => handleSelectPlayer(item)}>
                  <View style={styles.playerInfoRow}>
                    <Image 
                      source={{ uri: item.flagUrl || 'https://via.placeholder.com/30x20.png?text=?' }} 
                      style={styles.modalFlag} 
                      resizeMode="cover"
                    />
                    <View style={styles.playerMeta}>
                      <Text style={styles.playerName}>{item.firstName} {item.lastName}</Text>
                      <Text style={styles.playerTeam}>{item.teamName}</Text>
                    </View>
                  </View>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>{item.position}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.emptySearchText}>No se encontraron jugadores.</Text>
              )}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

interface PredictionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  player: Player | null;
  onPress: () => void;
  onClear: () => void;
}

function PredictionCard({ title, subtitle, icon, player, onPress, onClear }: PredictionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name={icon as any} size={22} color="#EAB308" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      {player ? (
        <View style={styles.selectedPlayerContainer}>
          <View style={styles.playerMainRow}>
            <Image 
              source={{ uri: player.flagUrl || 'https://via.placeholder.com/30x20.png?text=?' }} 
              style={styles.flag} 
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedPlayerName}>{player.firstName} {player.lastName}</Text>
              <Text style={styles.selectedPlayerTeam}>{player.teamName}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.changeBtn} onPress={onPress}>
              <Ionicons name="swap-horizontal-outline" size={16} color="#EAB308" />
              <Text style={styles.changeBtnText}>Cambiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.clearBtnText}>Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.selectPlaceholder} onPress={onPress}>
          <Ionicons name="add-circle-outline" size={24} color="#64748B" />
          <Text style={styles.placeholderText}>Seleccionar Jugador</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  selectPlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedPlayerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  playerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  flag: {
    width: 38,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectedPlayerName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  selectedPlayerTeam: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeBtnText: {
    color: '#EAB308',
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveGradient: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  saveBtnText: {
    color: '#422006',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    height: 48,
    fontSize: 14,
    fontWeight: '600',
  },
  modalCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalFlag: {
    width: 30,
    height: 20,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  playerMeta: {
    flex: 1,
  },
  playerName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  playerTeam: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  positionBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  positionText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: '900',
  },
  emptySearchText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
