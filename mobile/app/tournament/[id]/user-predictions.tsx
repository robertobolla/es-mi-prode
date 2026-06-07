import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ── Interfaces ──────────────────────────────────────────────

interface TeamInfo {
  name?: string;
  flagUrl?: string;
}

interface MatchPrediction {
  homeScore: number;
  awayScore: number;
  points: number | null;
}

interface MatchData {
  id: string;
  matchDate: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: string;
  homeScore90?: number | null;
  awayScore90?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  groupName?: string;
  isCustom: boolean;
  prediction: MatchPrediction | null;
}

interface GroupTeamInfo {
  id: string;
  name: string;
  flagUrl?: string;
}

interface GroupData {
  id: string;
  name: string;
  teams: GroupTeamInfo[];
  officialFirstPlaceId: string | null;
  officialSecondPlaceId: string | null;
  prediction: {
    firstPlaceId: string;
    secondPlaceId: string;
  } | null;
}

interface PhaseData {
  id: string;
  name: string;
  matches: MatchData[];
  groups?: GroupData[];
}

interface OutrightPlayerInfo {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  flagUrl: string | null;
}

interface OutrightsData {
  predictMvp: boolean;
  predictTopScorer: boolean;
  predictGoalkeeper: boolean;
  prediction: {
    mvp: OutrightPlayerInfo | null;
    topScorer: OutrightPlayerInfo | null;
    goalkeeper: OutrightPlayerInfo | null;
  } | null;
}

interface UserPredictionsResponse {
  phases: PhaseData[];
  outrights: OutrightsData | null;
}

// ── Main Screen ─────────────────────────────────────────────

export default function UserPredictionsScreen() {
  const { id, userId, username } = useLocalSearchParams();
  const [data, setData] = useState<UserPredictionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [selectedFecha, setSelectedFecha] = useState('Fecha 1');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id, userId]);

  const fetchData = async () => {
    try {
      const [response, me] = await Promise.all([
        api.get(`/predictions/tournament/${id}/user/${userId}`) as Promise<UserPredictionsResponse>,
        api.get('/users/me') as Promise<{ id: string }>,
      ]);
      setData(response);
      setCurrentUserId(me.id);

      // Auto-select first phase with matches
      if (response.phases.length > 0) {
        const firstWithMatches = response.phases.findIndex(p => p.matches.length > 0);
        if (firstWithMatches !== -1) {
          setCurrentPhaseIndex(firstWithMatches);
        }
      }
    } catch (e) {
      // Don't navigate back — show error state inline so the screen always opens
      setFetchError(true);
      // Fetch current user in background if main call fails
      api.get('/users/me')
        .then((me: any) => setCurrentUserId(me.id))
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleUserActions = (targetUserId: string, targetUsername: string) => {
    Alert.alert(
      `Acciones para @${targetUsername}`,
      '¿Qué deseas hacer con este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reportar usuario', 
          onPress: () => promptReportReason(targetUserId, targetUsername) 
        },
        { 
          text: 'Bloquear usuario', 
          style: 'destructive',
          onPress: () => confirmBlockUser(targetUserId, targetUsername) 
        },
      ]
    );
  };

  const confirmBlockUser = (targetUserId: string, targetUsername: string) => {
    Alert.alert(
      'Bloquear usuario',
      `¿Estás seguro de que deseas bloquear a @${targetUsername}? Ya no verás sus mensajes en el chat de ningún torneo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/users/block', { blockedId: targetUserId });
              Alert.alert('Bloqueado', `@${targetUsername} ha sido bloqueado.`);
              router.back();
            } catch (e) {
              const err = e as Error;
              Alert.alert('Error', err.message || 'No se pudo bloquear al usuario.');
            }
          }
        }
      ]
    );
  };

  const promptReportReason = (targetUserId: string, targetUsername: string) => {
    Alert.alert(
      'Reportar usuario',
      'Selecciona el motivo del reporte:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Spam / Mensajes molestos', onPress: () => submitReport(targetUserId, targetUsername, 'Spam / Mensajes molestos') },
        { text: 'Lenguaje inapropiado / Odio', onPress: () => submitReport(targetUserId, targetUsername, 'Lenguaje inapropiado / Odio') },
        { text: 'Foto de perfil / Avatar indebido', onPress: () => submitReport(targetUserId, targetUsername, 'Foto de perfil / Avatar indebido') },
      ]
    );
  };

  const submitReport = async (targetUserId: string, targetUsername: string, reason: string) => {
    try {
      await api.post('/users/report', { reportedId: targetUserId, reason });
      Alert.alert('Reporte enviado', `Gracias por informarnos. Revisaremos el comportamiento de @${targetUsername} a la brevedad.`);
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', err.message || 'No se pudo enviar el reporte.');
    }
  };

  // Group matches by "Fecha N" within Fase de Grupos
  const groupMatchesByFecha = (matches: MatchData[]) => {
    const byGroup: Record<string, MatchData[]> = {};
    matches.forEach(m => {
      const g = m.groupName || 'General';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(m);
    });

    const result: Record<string, Record<string, MatchData[]>> = {};
    Object.keys(byGroup).forEach(groupName => {
      const sorted = byGroup[groupName].sort(
        (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime(),
      );
      sorted.forEach((m, i) => {
        const roundLabel = m.isCustom ? 'General' : `Fecha ${Math.floor(i / 2) + 1}`;
        const gLabel = m.groupName || 'General';
        if (!result[roundLabel]) result[roundLabel] = {};
        if (!result[roundLabel][gLabel]) result[roundLabel][gLabel] = [];
        result[roundLabel][gLabel].push(m);
      });
    });
    return result;
  };

  // ── Derived state (all hooks must be before any conditional return) ──
  const phases = data?.phases ?? [];
  const currentPhase = phases[currentPhaseIndex];
  const hasGroupPhase = currentPhase?.name === 'Fase de Grupos';
  const hasAnyLockedContent = phases.some(
    p => p.matches.length > 0 || (p.groups && p.groups.length > 0)
  );

  // Stats counters — always call useMemo regardless of data state
  const stats = useMemo(() => {
    let total = 0;
    let exact = 0;
    let correct = 0;
    let missed = 0;
    phases.forEach(p => {
      p.matches.forEach(m => {
        if (m.prediction && m.prediction.points !== null) {
          total++;
          if (m.prediction.points >= 5) exact++;
          else if (m.prediction.points > 0) correct++;
          else missed++;
        }
      });
    });
    return { total, exact, correct, missed };
  }, [phases]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  // ── Conditional renders (after all hooks) ──

  // Error state — always opens the screen, never navigates back
  if (fetchError || !data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title} numberOfLines={1}>
              {username || 'Usuario'}
            </Text>
            <Text style={styles.subtitle}>Predicciones</Text>
          </View>
          {currentUserId !== userId && (
            <TouchableOpacity 
              style={styles.moreBtn} 
              onPress={() => handleUserActions(userId as string, username as string)}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </LinearGradient>
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="lock-closed" size={56} color="#334155" />
          <Text style={[styles.emptyText, { marginTop: 20 }]}>Sin predicciones disponibles</Text>
          <Text style={styles.emptySubtext}>
            Las predicciones de {username || 'este usuario'} se mostrarán{'\n'}1 hora antes del inicio de cada partido.
          </Text>
        </View>
      </View>
    );
  }

  // No locked predictions yet — show informative empty state
  if (!hasAnyLockedContent) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.title} numberOfLines={1}>
              {username || 'Usuario'}
            </Text>
            <Text style={styles.subtitle}>Predicciones</Text>
          </View>
          {currentUserId !== userId && (
            <TouchableOpacity 
              style={styles.moreBtn} 
              onPress={() => handleUserActions(userId as string, username as string)}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </LinearGradient>
        <View style={[styles.centered, { flex: 1, paddingHorizontal: 32 }]}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="time-outline" size={40} color="#EAB308" />
          </View>
          <Text style={styles.emptyHeading}>Aún no disponibles</Text>
          <Text style={styles.emptyText}>
            Las predicciones de {username || 'este usuario'} se verán aquí una vez que comiencen a bloquearse.
          </Text>
          <Text style={styles.emptySubtext}>
            Cada predicción se hace visible 1 hora antes del inicio del partido correspondiente.
          </Text>
        </View>
      </View>
    );
  }

  return (

    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.title} numberOfLines={1}>
            {username || 'Usuario'}
          </Text>
          <Text style={styles.subtitle}>Predicciones</Text>
        </View>
        {currentUserId !== userId && (
          <TouchableOpacity 
            style={styles.moreBtn} 
            onPress={() => handleUserActions(userId as string, username as string)}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Stats Bar */}
      {stats.total > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.exact}</Text>
            <Text style={styles.statLabel}>Exactos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EAB308' }]}>{stats.correct}</Text>
            <Text style={styles.statLabel}>Correctos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.missed}</Text>
            <Text style={styles.statLabel}>Errados</Text>
          </View>
        </View>
      )}

      {/* Phase Selector */}
      {phases.length > 1 && (
        <View style={styles.phaseSelector}>
          <TouchableOpacity
            style={[styles.navBtn, currentPhaseIndex === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentPhaseIndex(i => Math.max(0, i - 1))}
            disabled={currentPhaseIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentPhaseIndex === 0 ? '#334155' : '#EAB308'}
            />
          </TouchableOpacity>
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>{currentPhase?.name}</Text>
            <Text style={styles.phaseSubtitle}>
              {currentPhaseIndex + 1} de {phases.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.navBtn, currentPhaseIndex === phases.length - 1 && styles.navBtnDisabled]}
            onPress={() => setCurrentPhaseIndex(i => Math.min(phases.length - 1, i + 1))}
            disabled={currentPhaseIndex === phases.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={currentPhaseIndex === phases.length - 1 ? '#334155' : '#EAB308'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Fecha Sub-tabs (Fase de Grupos) */}
      {hasGroupPhase && (
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
          selectedFecha === 'Clasificados' && hasGroupPhase ? (
            <GroupPredictionsReadOnly groups={currentPhase.groups || []} />
          ) : (
            <View>
              {currentPhase.matches.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="lock-closed" size={48} color="#334155" />
                  <Text style={styles.emptyText}>
                    Las predicciones de esta fase aún no están disponibles
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Se mostrarán una vez que los partidos se bloqueen (1h antes del inicio)
                  </Text>
                </View>
              ) : (
                (() => {
                  const grouped = groupMatchesByFecha(currentPhase.matches);
                  const rounds = hasGroupPhase
                    ? [selectedFecha]
                    : Object.keys(grouped).sort((a, b) =>
                        a.localeCompare(b, undefined, { numeric: true }),
                      );

                  return rounds.map(round => {
                    if (!grouped[round]) return null;
                    return (
                      <View key={round} style={styles.roundContainer}>
                        {round !== 'General' && (
                          <Text style={styles.roundTitle}>{round}</Text>
                        )}
                        {Object.keys(grouped[round])
                          .sort()
                          .map(group => (
                            <View key={group} style={styles.groupContainer}>
                              {group !== 'General' && (
                                <Text style={styles.groupHeader}>{group}</Text>
                              )}
                              {grouped[round][group].map(match => (
                                <ReadOnlyMatchCard key={match.id} match={match} />
                              ))}
                            </View>
                          ))}
                      </View>
                    );
                  });
                })()
              )}
            </View>
          )
        ) : (
          <Text style={styles.emptyText}>No hay datos disponibles</Text>
        )}

        {/* Outrights Section */}
        {data.outrights && (
          <OutrightsReadOnly outrights={data.outrights} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── ReadOnly Match Card ─────────────────────────────────────

function ReadOnlyMatchCard({ match }: { match: MatchData }) {
  const isFinished = match.status === 'FINISHED';
  const prediction = match.prediction;
  const officialHome = match.homeScore90 ?? match.homeScore;
  const officialAway = match.awayScore90 ?? match.awayScore;

  // Determine badge color based on points
  const getBadgeStyle = () => {
    if (!prediction || prediction.points === null) return null;
    if (prediction.points >= 5) return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', color: '#22C55E', label: 'EXACTO' };
    if (prediction.points > 0) return { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', color: '#EAB308', label: 'CORRECTO' };
    return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', label: 'ERRADO' };
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.matchCard, badge && { borderColor: badge.border }]}>
      {/* Date row */}
      <View style={styles.matchDateRow}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
          <Text style={styles.dateText}>{formatDate(new Date(match.matchDate))}</Text>
        </View>
        {badge && (
          <View style={[styles.pointsBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.pointsBadgeText, { color: badge.color }]}>
              {badge.label} +{prediction?.points}
            </Text>
          </View>
        )}
      </View>

      {/* Teams and Prediction */}
      <View style={styles.matchRow}>
        {/* Home Team */}
        <View style={styles.teamCol}>
          <Image
            source={{ uri: match.homeTeam.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }}
            style={styles.flag}
            resizeMode="cover"
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam.name || 'Por clasificar'}
          </Text>
        </View>

        {/* Prediction Score */}
        <View style={styles.scoreContainer}>
          {prediction ? (
            <>
              <View style={[styles.scoreBox, badge && { borderColor: badge.border }]}>
                <Text style={[styles.scoreText, badge && { color: badge.color }]}>
                  {prediction.homeScore}
                </Text>
              </View>
              <Text style={styles.vsText}>-</Text>
              <View style={[styles.scoreBox, badge && { borderColor: badge.border }]}>
                <Text style={[styles.scoreText, badge && { color: badge.color }]}>
                  {prediction.awayScore}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noPrediction}>
              <Text style={styles.noPredictionText}>—</Text>
            </View>
          )}
        </View>

        {/* Away Team */}
        <View style={[styles.teamCol, { alignItems: 'center' }]}>
          <Image
            source={{ uri: match.awayTeam.flagUrl || 'https://via.placeholder.com/40x25.png?text=?' }}
            style={styles.flag}
            resizeMode="cover"
          />
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam.name || 'Por clasificar'}
          </Text>
        </View>
      </View>

      {/* Official Result */}
      {isFinished && officialHome !== null && officialHome !== undefined && (
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>
            Final: {officialHome} - {officialAway}
          </Text>
        </View>
      )}

      {/* Pending indicator */}
      {!isFinished && prediction && (
        <View style={styles.pendingRow}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <Text style={styles.pendingText}>Partido pendiente</Text>
        </View>
      )}
    </View>
  );
}

// ── Group Predictions Read-Only ─────────────────────────────

function GroupPredictionsReadOnly({ groups }: { groups: GroupData[] }) {
  if (groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed" size={48} color="#334155" />
        <Text style={styles.emptyText}>
          Las predicciones de clasificados aún no están disponibles
        </Text>
        <Text style={styles.emptySubtext}>
          Se mostrarán una vez que cierre la fase de grupos
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.groupsContainer}>
      <Text style={styles.sectionTitle}>Clasificación de Grupos</Text>
      {groups.map(group => {
        const pred = group.prediction;
        const firstTeam = pred ? group.teams.find(t => t.id === pred.firstPlaceId) : null;
        const secondTeam = pred ? group.teams.find(t => t.id === pred.secondPlaceId) : null;

        // Check if prediction matches official results
        const hasOfficial = !!group.officialFirstPlaceId && !!group.officialSecondPlaceId;
        let groupBadge: { color: string; label: string } | null = null;
        if (hasOfficial && pred) {
          const p = [pred.firstPlaceId, pred.secondPlaceId];
          const o = [group.officialFirstPlaceId!, group.officialSecondPlaceId!];
          if (p[0] === o[0] && p[1] === o[1]) {
            groupBadge = { color: '#22C55E', label: 'Orden Exacto' };
          } else if (p.includes(o[0]) && p.includes(o[1])) {
            groupBadge = { color: '#EAB308', label: 'Ambos Correctos' };
          } else if (p.includes(o[0]) || p.includes(o[1])) {
            groupBadge = { color: '#F97316', label: 'Uno Correcto' };
          } else {
            groupBadge = { color: '#EF4444', label: 'Errado' };
          }
        }

        return (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupCardHeader}>
              <Text style={styles.groupCardTitle}>{group.name}</Text>
              {groupBadge && (
                <View style={[styles.groupBadge, { backgroundColor: `${groupBadge.color}20`, borderColor: `${groupBadge.color}40` }]}>
                  <Text style={[styles.groupBadgeText, { color: groupBadge.color }]}>
                    {groupBadge.label}
                  </Text>
                </View>
              )}
            </View>

            {pred ? (
              <View style={styles.groupPredictions}>
                <View style={styles.groupPickRow}>
                  <View style={styles.positionBadge1}>
                    <Text style={styles.positionText}>1º</Text>
                  </View>
                  <Image
                    source={{ uri: firstTeam?.flagUrl || 'https://via.placeholder.com/30x20.png?text=?' }}
                    style={styles.groupFlag}
                    resizeMode="cover"
                  />
                  <Text style={styles.groupTeamName}>
                    {firstTeam?.name || '—'}
                  </Text>
                </View>
                <View style={styles.groupPickRow}>
                  <View style={styles.positionBadge2}>
                    <Text style={styles.positionText}>2º</Text>
                  </View>
                  <Image
                    source={{ uri: secondTeam?.flagUrl || 'https://via.placeholder.com/30x20.png?text=?' }}
                    style={styles.groupFlag}
                    resizeMode="cover"
                  />
                  <Text style={styles.groupTeamName}>
                    {secondTeam?.name || '—'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noPredictionContainer}>
                <Text style={styles.noPredictionLabel}>No predijo este grupo</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Outrights Read-Only ─────────────────────────────────────

function OutrightsReadOnly({ outrights }: { outrights: OutrightsData }) {
  const pred = outrights.prediction;
  const hasAny = pred?.mvp || pred?.topScorer || pred?.goalkeeper;

  if (!hasAny) {
    return null;
  }

  const cards: { title: string; icon: string; player: OutrightPlayerInfo | null }[] = [];
  if (outrights.predictMvp) {
    cards.push({ title: 'MVP', icon: 'trophy-outline', player: pred?.mvp || null });
  }
  if (outrights.predictTopScorer) {
    cards.push({ title: 'Goleador', icon: 'football-outline', player: pred?.topScorer || null });
  }
  if (outrights.predictGoalkeeper) {
    cards.push({ title: 'Mejor Arquero', icon: 'hand-right-outline', player: pred?.goalkeeper || null });
  }

  return (
    <View style={styles.outrightsSection}>
      <View style={styles.outrightsHeader}>
        <Ionicons name="trophy" size={20} color="#EAB308" />
        <Text style={styles.sectionTitle}>Predicciones Especiales</Text>
      </View>
      {cards.map(card => (
        <View key={card.title} style={styles.outrightCard}>
          <View style={styles.outrightCardHeader}>
            <Ionicons name={card.icon as keyof typeof Ionicons.glyphMap} size={18} color="#EAB308" />
            <Text style={styles.outrightCardTitle}>{card.title}</Text>
          </View>
          {card.player ? (
            <View style={styles.outrightPlayerRow}>
              <Image
                source={{ uri: card.player.flagUrl || 'https://via.placeholder.com/30x20.png?text=?' }}
                style={styles.groupFlag}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.outrightPlayerName}>
                  {card.player.firstName} {card.player.lastName}
                </Text>
                <Text style={styles.outrightPlayerTeam}>{card.player.teamName}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noPredictionLabel}>Sin selección</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

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
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Phase Selector
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

  // Fecha Selector
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

  scrollContent: {
    padding: 20,
  },

  // Match Card
  matchCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  matchDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pointsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  scoreBox: {
    backgroundColor: '#0F172A',
    width: 50,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EAB308',
  },
  vsText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noPrediction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 8,
  },
  noPredictionText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
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
  pendingRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    fontWeight: '600',
  },

  // Rounds and Groups
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

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },

  // Group Predictions
  groupsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
  groupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  groupPredictions: {
    gap: 10,
  },
  groupPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  positionBadge1: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionBadge2: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#CA8A04',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 12,
  },
  groupFlag: {
    width: 30,
    height: 20,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  groupTeamName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  noPredictionContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noPredictionLabel: {
    color: '#64748B',
    fontStyle: 'italic',
    fontSize: 13,
    fontWeight: '600',
  },

  // Outrights Section
  outrightsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  outrightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  outrightCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  outrightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  outrightCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outrightPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
  },
  outrightPlayerName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  outrightPlayerTeam: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
