import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { formatDate, formatShortDate } from '../../../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface Team {
  id: string;
  name: string;
  flagUrl?: string;
}

interface Prediction {
  homeScore: number;
  awayScore: number;
}

interface Match {
  id: string;
  matchDate: string;
  closeDate?: string;
  homeTeam: Team;
  awayTeam: Team;
  myPrediction?: Prediction;
  status: string;
  homeScore90?: number;
  homeScore?: number;
  awayScore90?: number;
  awayScore?: number;
  isOpen: boolean;
  isCustom: boolean;
  groupName?: string;
  roundLabel?: string;
}

interface GroupTeam {
  id: string;
  name: string;
  flagUrl?: string;
}

interface GroupPrediction {
  id: string;
  groupId: string;
  firstPlaceId: string;
  secondPlaceId: string;
}

interface Group {
  id: string;
  name: string;
  teams: GroupTeam[];
  myPrediction: GroupPrediction | null;
}

interface Phase {
  id: string;
  name: string;
  isOpen: boolean;
  matches: Match[];
  groups?: Group[];
}

export default function PredictScreen() {
  const { id, initialTab } = useLocalSearchParams();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedFecha, setSelectedFecha] = useState('Fecha 1');

  useEffect(() => {
    fetchMatches();
  }, [id]);

  useEffect(() => {
    if (initialTab) {
      setSelectedFecha(initialTab as string);
    } else {
      setSelectedFecha('Fecha 1');
    }
  }, [currentPhaseIndex, initialTab]);

  const fetchMatches = async () => {
    try {
      const data = await api.get(`/predictions/tournament/${id}`);
      setPhases(data);
      
      // Auto-select current phase: first open phase or the one with upcoming matches
      const openIndex = data.findIndex((p: Phase) => p.isOpen);
      if (openIndex !== -1) {
        setCurrentPhaseIndex(openIndex);
      } else if (data.length > 0) {
        // If all closed, show the last one (most likely the current one that just ended)
        setCurrentPhaseIndex(data.length - 1);
      }
    } catch (e: any) {
      Alert.alert('Error', 'No se pudieron cargar los partidos');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrediction = async (matchId: string, homeScore: string, awayScore: string, isCustom: boolean) => {
    if (homeScore === '' || awayScore === '') return;
    
    const previousPhases = [...phases];

    // Optimistically update local phases state
    setPhases((prevPhases) =>
      prevPhases.map((phase) => ({
        ...phase,
        matches: phase.matches.map((m) => {
          if (m.id === matchId) {
            return {
              ...m,
              myPrediction: {
                homeScore: parseInt(homeScore),
                awayScore: parseInt(awayScore),
              },
            };
          }
          return m;
        }),
      }))
    );

    // Trigger subtle tactile feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      const endpoint = isCustom ? '/predictions/custom-match' : '/predictions/match';
      const payload = isCustom 
        ? { customMatchId: matchId, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) }
        : { matchId, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) };
        
      await api.post(endpoint, payload);
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message || 'No se pudo guardar la predicción');
      // Rollback on error
      setPhases(previousPhases);
    }
  };

  const groupMatches = (matches: Match[]) => {
    const grouped: Record<string, Record<string, Match[]>> = {};
    
    // Group matches by groupName first to determine their position within the group
    const byGroup: Record<string, Match[]> = {};
    matches.forEach(m => {
      const g = m.groupName || 'General';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(m);
    });

    // For each group, sort by date and assign Fecha based on position
    const matchesWithRound: Match[] = [];
    Object.keys(byGroup).forEach(groupName => {
      const sortedInGroup = byGroup[groupName].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
      sortedInGroup.forEach((m, i) => {
        // For custom matches, we don't split by 2. All go to 'General' round.
        // For official matches, we keep the original logic (2 matches per fecha).
        const roundLabel = m.isCustom ? 'General' : `Fecha ${Math.floor(i / 2) + 1}`;
        matchesWithRound.push({ ...m, roundLabel });
      });
    });
    
    // Now group by the assigned roundLabel
    matchesWithRound.forEach(m => {
      const roundLabel = m.roundLabel || 'General';
      const groupLabel = m.groupName || 'General';
      
      if (!grouped[roundLabel]) grouped[roundLabel] = {};
      if (!grouped[roundLabel][groupLabel]) grouped[roundLabel][groupLabel] = [];
      
      grouped[roundLabel][groupLabel].push(m);
    });
    
    return grouped;
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#EAB308" />
    </View>
  );

  const currentPhase = phases[currentPhaseIndex];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Predicciones</Text>
      </LinearGradient>

      {/* Selector de Fases */}
      {phases.length > 1 && (
        <View style={styles.phaseSelector}>
          <TouchableOpacity 
            style={[styles.navBtn, currentPhaseIndex === 0 && styles.navBtnDisabled]} 
            onPress={() => setCurrentPhaseIndex(i => Math.max(0, i - 1))}
            disabled={currentPhaseIndex === 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentPhaseIndex === 0 ? '#334155' : '#EAB308'} />
          </TouchableOpacity>

          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>{currentPhase?.name}</Text>
            <Text style={styles.phaseSubtitle}>Matchday {currentPhaseIndex + 1} de {phases.length}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.navBtn, currentPhaseIndex === phases.length - 1 && styles.navBtnDisabled]} 
            onPress={() => setCurrentPhaseIndex(i => Math.min(phases.length - 1, i + 1))}
            disabled={currentPhaseIndex === phases.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color={currentPhaseIndex === phases.length - 1 ? '#334155' : '#EAB308'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selector de Fechas (Sub-tab en Fase de Grupos) */}
      {currentPhase?.name === 'Fase de Grupos' && (
        <View style={styles.fechaSelectorContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fechaSelectorScroll}
          >
            {['Fecha 1', 'Fecha 2', 'Fecha 3', 'Clasificados'].map(f => (
              <TouchableOpacity 
                key={f}
                style={[styles.fechaTab, selectedFecha === f && styles.fechaTabActive]}
                onPress={() => setSelectedFecha(f)}
              >
                <Text style={[styles.fechaTabText, selectedFecha === f && styles.fechaTabTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentPhase ? (
          selectedFecha === 'Clasificados' && currentPhase.name === 'Fase de Grupos' ? (
            <GroupPredictionsView 
              groups={currentPhase.groups || []}
              isOpen={currentPhase.isOpen}
              tournamentId={id as string}
              onSaved={fetchMatches}
            />
          ) : (
            <View key={currentPhase.id} style={styles.phaseContainer}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseName}>{currentPhase.name}</Text>
                {!currentPhase.isOpen && (
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedText}>CERRADO</Text>
                  </View>
                )}
              </View>

              {(() => {
                const grouped = groupMatches(currentPhase.matches);
                const rounds = currentPhase.name === 'Fase de Grupos' ? [selectedFecha] : Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                
                const isDieciseisavos = currentPhase.name === 'Dieciseisavos de final' && currentPhase.matches.length === 16;
                const matchIndexMap = new Map<string, number>();
                if (isDieciseisavos) {
                  const sorted = [...currentPhase.matches].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
                  sorted.forEach((m, idx) => {
                    matchIndexMap.set(m.id, idx);
                  });
                }

                return rounds.map(round => {
                  if (!grouped[round]) return null;
                  return (
                    <View key={round} style={styles.roundContainer}>
                      {round !== 'General' && <Text style={styles.roundTitle}>{round}</Text>}
                      {Object.keys(grouped[round]).sort().map(group => (
                        <View key={group} style={styles.groupContainer}>
                          {group !== 'General' && <Text style={styles.groupHeader}>{group}</Text>}
                          {grouped[round][group].map((match) => {
                            const matchIdx = isDieciseisavos ? matchIndexMap.get(match.id) : undefined;
                            const homePlaceholder = matchIdx !== undefined ? DIECISEISAVOS_PAIRINGS[matchIdx]?.home : undefined;
                            const awayPlaceholder = matchIdx !== undefined ? DIECISEISAVOS_PAIRINGS[matchIdx]?.away : undefined;

                            return (
                              <MatchCard 
                                key={match.id} 
                                match={match} 
                                isOpen={match.isOpen}
                                onSave={(h: string, a: string) => handleSavePrediction(match.id, h, a, match.isCustom)} 
                                isSaving={saving === match.id}
                                homePlaceholder={homePlaceholder}
                                awayPlaceholder={awayPlaceholder}
                              />
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  );
                });
              })()}
            </View>
          )
        ) : (
          phases.length === 0 && <Text style={styles.emptyText}>No hay partidos disponibles para predecir</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const DIECISEISAVOS_PAIRINGS = [
  { home: '2° Grupo A', away: '2° Grupo B' },
  { home: '1° Grupo E', away: '3° Grupo A/B/C/D/F' },
  { home: '1° Grupo F', away: '2° Grupo C' },
  { home: '1° Grupo C', away: '2° Grupo F' },
  { home: '1° Grupo I', away: '3° Grupo C/D/F/G/H' },
  { home: '2° Grupo E', away: '2° Grupo I' },
  { home: '1° Grupo A', away: '3° Grupo C/E/F/H/I' },
  { home: '1° Grupo L', away: '3° Grupo E/H/I/J/K' },
  { home: '1° Grupo D', away: '3° Grupo B/E/F/I/J' },
  { home: '1° Grupo G', away: '3° Grupo A/E/H/I/J' },
  { home: '2° Grupo K', away: '2° Grupo L' },
  { home: '1° Grupo H', away: '2° Grupo J' },
  { home: '1° Grupo B', away: '3° Grupo E/F/G/I/J' },
  { home: '1° Grupo J', away: '2° Grupo H' },
  { home: '1° Grupo K', away: '3° Grupo D/E/I/J/L' },
  { home: '2° Grupo D', away: '2° Grupo G' },
];

interface MatchCardProps {
  match: Match;
  isOpen: boolean;
  onSave: (homeScore: string, awayScore: string) => void;
  isSaving: boolean;
  homePlaceholder?: string;
  awayPlaceholder?: string;
}

function MatchCard({ match, isOpen, onSave, isSaving, homePlaceholder, awayPlaceholder }: MatchCardProps) {
  const [home, setHome] = useState(match.myPrediction?.homeScore?.toString() || '');
  const [away, setAway] = useState(match.myPrediction?.awayScore?.toString() || '');

  const hasChanged = home !== (match.myPrediction?.homeScore?.toString() || '') || 
                     away !== (match.myPrediction?.awayScore?.toString() || '');

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchTimes}>
        <View style={styles.timeItem}>
          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
          <Text style={styles.timeText}>
            Inicio: {formatDate(new Date(match.matchDate))}
          </Text>
        </View>
        {match.closeDate && (
          <View style={styles.timeItem}>
            <Ionicons name="time-outline" size={12} color="#EAB308" />
            <Text style={[styles.timeText, { color: '#EAB308' }]}>
              Cierra: {formatShortDate(new Date(match.closeDate))}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.matchRow}>
        {/* Home Team */}
        <View style={styles.teamCol}>
          <Image 
            source={{ uri: match.homeTeam.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }} 
            style={styles.flag} 
            resizeMode="cover"
          />
          {match.homeTeam.name ? (
            <Text style={styles.teamName} numberOfLines={1}>{match.homeTeam.name}</Text>
          ) : (
            <>
              <Text style={[styles.teamName, { color: '#64748B' }]} numberOfLines={1}>Por clasificar</Text>
              {homePlaceholder ? (
                <Text style={styles.placeholderLabel}>{homePlaceholder}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Inputs */}
        <View style={styles.scoreContainer}>
          <TextInput
            style={[styles.scoreInput, !isOpen && styles.disabledInput]}
            value={home}
            onChangeText={setHome}
            keyboardType="numeric"
            maxLength={2}
            editable={isOpen}
            onBlur={() => hasChanged && onSave(home, away)}
          />
          <Text style={styles.vsText}>-</Text>
          <TextInput
            style={[styles.scoreInput, !isOpen && styles.disabledInput]}
            value={away}
            onChangeText={setAway}
            keyboardType="numeric"
            maxLength={2}
            editable={isOpen}
            onBlur={() => hasChanged && onSave(home, away)}
          />
        </View>

        {/* Away Team */}
        <View style={[styles.teamCol, { alignItems: 'center' }]}>
          <Image 
            source={{ uri: match.awayTeam.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }} 
            style={styles.flag} 
            resizeMode="cover"
          />
          {match.awayTeam.name ? (
            <Text style={styles.teamName} numberOfLines={1}>{match.awayTeam.name}</Text>
          ) : (
            <>
              <Text style={[styles.teamName, { color: '#64748B' }]} numberOfLines={1}>Por clasificar</Text>
              {awayPlaceholder ? (
                <Text style={styles.placeholderLabel}>{awayPlaceholder}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#EAB308" />
        </View>
      )}
      
      {match.status === 'FINISHED' && (
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Final: {match.homeScore90 ?? match.homeScore} - {match.awayScore90 ?? match.awayScore}</Text>
        </View>
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
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
  },
  phaseContainer: {
    marginBottom: 32,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  phaseName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  roundContainer: {
    marginBottom: 24,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  closedText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    width: 32,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  teamName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderLabel: {
    fontSize: 10,
    color: '#EAB308',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 10,
  },
  scoreInput: {
    backgroundColor: '#0F172A',
    color: '#EAB308',
    width: 50,
    height: 55,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  disabledInput: {
    color: '#64748B',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  vsText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    opacity: 0.8,
  },
  deadlineText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  matchTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  phaseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(51, 65, 85, 0.1)',
    borderColor: 'rgba(51, 65, 85, 0.2)',
  },
  phaseInfo: {
    alignItems: 'center',
  },
  phaseTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phaseSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  fechaSelectorContainer: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  fechaSelectorScroll: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  fechaTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fechaTabActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  fechaTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  fechaTabTextActive: {
    color: '#EAB308',
  },
  groupsViewContainer: {
    marginBottom: 20,
  },
  groupsViewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupsViewSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
  },
  groupCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  groupCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EAB308',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  teamsList: {
    gap: 10,
  },
  teamPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  teamPickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teamPickName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  pickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pickBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pickBtnActiveFirst: {
    backgroundColor: '#EAB308',
    borderColor: '#EAB308',
  },
  pickBtnActiveSecond: {
    backgroundColor: '#CA8A04',
    borderColor: '#CA8A04',
  },
  pickBtnDisabled: {
    opacity: 0.6,
  },
  pickBtnText: {
    color: '#94A3B8',
    fontWeight: '900',
    fontSize: 12,
  },
  pickBtnTextActive: {
    color: '#422006',
  },
});

interface GroupPredictionsViewProps {
  groups: Group[];
  isOpen: boolean;
  tournamentId: string;
  onSaved: () => void;
}

function GroupPredictionsView({ groups, isOpen, tournamentId, onSaved }: GroupPredictionsViewProps) {
  const [picks, setPicks] = useState<Record<string, { firstPlaceId: string; secondPlaceId: string }>>({});
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  useEffect(() => {
    const initialPicks: Record<string, { firstPlaceId: string; secondPlaceId: string }> = {};
    groups.forEach(g => {
      initialPicks[g.id] = {
        firstPlaceId: g.myPrediction?.firstPlaceId || '',
        secondPlaceId: g.myPrediction?.secondPlaceId || '',
      };
    });
    setPicks(initialPicks);
  }, [groups]);

  const handlePick = async (groupId: string, teamId: string, position: 'first' | 'second') => {
    if (!isOpen) return;

    const current = picks[groupId] || { firstPlaceId: '', secondPlaceId: '' };
    let newFirst = current.firstPlaceId;
    let newSecond = current.secondPlaceId;

    if (position === 'first') {
      if (newSecond === teamId) {
        newSecond = '';
      }
      newFirst = newFirst === teamId ? '' : teamId;
    } else {
      if (newFirst === teamId) {
        newFirst = '';
      }
      newSecond = newSecond === teamId ? '' : teamId;
    }

    const updatedPicks = {
      ...picks,
      [groupId]: { firstPlaceId: newFirst, secondPlaceId: newSecond },
    };
    setPicks(updatedPicks);

    if (newFirst && newSecond) {
      setSavingGroupId(groupId);
      try {
        await api.post('/predictions/group', {
          groupId,
          firstPlaceId: newFirst,
          secondPlaceId: newSecond,
        });
        onSaved();
      } catch (e) {
        const err = e as Error;
        Alert.alert('Error', err.message || 'No se pudo guardar la clasificación');
      } finally {
        setSavingGroupId(null);
      }
    }
  };

  return (
    <View style={styles.groupsViewContainer}>
      <Text style={styles.groupsViewTitle}>Clasificación de Grupos</Text>
      <Text style={styles.groupsViewSubtitle}>
        {isOpen 
          ? 'Elegí el 1º y 2º puesto de cada grupo. Se guardará automáticamente al elegir ambos.'
          : 'Las predicciones de grupos están cerradas.'}
      </Text>

      {groups.map(group => {
        const current = picks[group.id] || { firstPlaceId: '', secondPlaceId: '' };
        const isSaving = savingGroupId === group.id;

        return (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupCardHeader}>
              <Text style={styles.groupCardTitle}>{group.name}</Text>
              {isSaving && <ActivityIndicator size="small" color="#EAB308" />}
            </View>

            <View style={styles.teamsList}>
              {group.teams.map(team => {
                const isFirst = current.firstPlaceId === team.id;
                const isSecond = current.secondPlaceId === team.id;

                return (
                  <View key={team.id} style={styles.teamPickRow}>
                    <View style={styles.teamPickInfo}>
                      <Image 
                        source={{ uri: team.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }} 
                        style={styles.flag} 
                        resizeMode="cover"
                      />
                      <Text style={styles.teamPickName}>{team.name}</Text>
                    </View>

                    <View style={styles.pickButtons}>
                      <TouchableOpacity
                        style={[
                          styles.pickBtn,
                          isFirst && styles.pickBtnActiveFirst,
                          !isOpen && styles.pickBtnDisabled
                        ]}
                        disabled={!isOpen}
                        onPress={() => handlePick(group.id, team.id, 'first')}
                      >
                        <Text style={[styles.pickBtnText, isFirst && styles.pickBtnTextActive]}>1º</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.pickBtn,
                          isSecond && styles.pickBtnActiveSecond,
                          !isOpen && styles.pickBtnDisabled
                        ]}
                        disabled={!isOpen}
                        onPress={() => handlePick(group.id, team.id, 'second')}
                      >
                        <Text style={[styles.pickBtnText, isSecond && styles.pickBtnTextActive]}>2º</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
