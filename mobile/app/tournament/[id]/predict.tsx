import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PredictScreen() {
  const { id } = useLocalSearchParams();
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      const data = await api.get(`/predictions/tournament/${id}`);
      setPhases(data);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudieron cargar los partidos');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrediction = async (matchId: string, homeScore: string, awayScore: string, isCustom: boolean) => {
    if (homeScore === '' || awayScore === '') return;
    
    setSaving(matchId);
    try {
      const endpoint = isCustom ? '/predictions/custom-match' : '/predictions/match';
      const payload = isCustom 
        ? { customMatchId: matchId, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) }
        : { matchId, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore) };
        
      await api.post(endpoint, payload);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la predicción');
    } finally {
      setSaving(null);
    }
  };

  const groupMatches = (matches: any[]) => {
    const grouped: any = {};
    
    // Group matches by groupName first to determine their position within the group
    const byGroup: { [key: string]: any[] } = {};
    matches.forEach(m => {
      const g = m.groupName || 'General';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(m);
    });

    // For each group, sort by date and assign Fecha based on position (2 matches per fecha)
    const matchesWithRound: any[] = [];
    Object.keys(byGroup).forEach(groupName => {
      const sortedInGroup = byGroup[groupName].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
      sortedInGroup.forEach((m, i) => {
        const roundNum = Math.floor(i / 2) + 1;
        matchesWithRound.push({ ...m, roundLabel: `Fecha ${roundNum}` });
      });
    });
    
    // Now group by the assigned roundLabel
    matchesWithRound.forEach(m => {
      const roundLabel = m.roundLabel;
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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.title}>Predicciones</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {phases.map((phase) => {
          const grouped = groupMatches(phase.matches);
          const rounds = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

          return (
            <View key={phase.id} style={styles.phaseContainer}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseName}>{phase.name}</Text>
                {!phase.isOpen && (
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedText}>CERRADO</Text>
                  </View>
                )}
              </View>

              {rounds.map(round => (
                <View key={round} style={styles.roundContainer}>
                  <Text style={styles.roundTitle}>{round}</Text>
                  {Object.keys(grouped[round]).sort().map(group => (
                    <View key={group} style={styles.groupContainer}>
                      <Text style={styles.groupHeader}>{group}</Text>
                      {grouped[round][group].map((match: any) => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          isOpen={phase.isOpen}
                          onSave={(h: string, a: string) => handleSavePrediction(match.id, h, a, match.isCustom)} 
                          isSaving={saving === match.id}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}
        {phases.length === 0 && (
          <Text style={styles.emptyText}>No hay partidos disponibles para predecir</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MatchCard({ match, isOpen, onSave, isSaving }: any) {
  const [home, setHome] = useState(match.myPrediction?.homeScore?.toString() || '');
  const [away, setAway] = useState(match.myPrediction?.awayScore?.toString() || '');

  const hasChanged = home !== (match.myPrediction?.homeScore?.toString() || '') || 
                     away !== (match.myPrediction?.awayScore?.toString() || '');

  return (
    <View style={styles.matchCard}>
      {match.closeDate && (
        <View style={styles.deadlineRow}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <Text style={styles.deadlineText}>
            Cierra: {new Date(match.closeDate).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}
      <View style={styles.matchRow}>
        {/* Home Team */}
        <View style={styles.teamCol}>
          <Image 
            source={{ uri: match.homeTeam.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }} 
            style={styles.flag} 
            resizeMode="cover"
          />
          <Text style={styles.teamName} numberOfLines={1}>{match.homeTeam.name}</Text>
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
          <Text style={styles.teamName} numberOfLines={1}>{match.awayTeam.name}</Text>
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
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
