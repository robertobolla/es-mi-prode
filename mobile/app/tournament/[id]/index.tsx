import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share as RNShare, Modal, Clipboard, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface TournamentPointsSystem {
  exactMatch?: number;
  exact?: number;
  correctResult?: number;
  result?: number;
  matchdayWinner?: number;
  topScorer?: number;
  mvp?: number;
  goalkeeper?: number;
  groupExact?: number;
  groupBoth?: number;
  groupOne?: number;
}

interface TournamentMember {
  id: string;
  userId: string;
  totalPoints: number;
  exactResults: number;
  correctResults: number;
  matchdayWins: number;
  user?: {
    username?: string;
    avatarUrl?: string | null;
  };
}

interface MatchdayWinner {
  id: string;
  matchdayNumber: number;
  userId: string;
}

interface TournamentDetail {
  id: string;
  creatorId: string;
  name: string;
  competitionId?: string | null;
  competition?: {
    id: string;
    name: string;
  } | null;
  shareCode: string;
  members?: TournamentMember[];
  pointsSystem?: TournamentPointsSystem;
  format?: string;
  predictTopScorer?: boolean;
  predictMvp?: boolean;
  predictGoalkeeper?: boolean;
  predictGroups?: boolean;
  matchdayWinners?: MatchdayWinner[];
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);



  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tData, uData] = await Promise.all([
        api.get(`/tournaments/${id}`),
        api.get('/users/me')
      ]);
      setTournament(tData as TournamentDetail);
      setCurrentUser(uData as UserProfile);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cargar la información');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchTournament = async () => {
    try {
      const data = await api.get(`/tournaments/${id}`);
      setTournament(data as TournamentDetail);
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  const handleShareLink = async () => {
    if (!tournament) return;
    try {
      const { API_URL } = await import('../../../lib/api');
      const shareUrl = `${API_URL}/invitations/join/${tournament.shareCode}`;
      
      await RNShare.share({
        message: `¡Sumate a mi prode "${tournament.name}"!\n\nUnite haciendo clic acá:\n${shareUrl}\n\nCódigo: ${tournament.shareCode}`,
      });
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message);
    }
  };

  const handleCopyCode = () => {
    if (!tournament) return;
    Clipboard.setString(tournament.shareCode);
    Alert.alert('¡Copiado!', 'El código se copió al portapapeles');
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#EAB308" />
    </View>
  );

  if (!tournament) return null;

  const members = tournament.members || [];
  const points = tournament.pointsSystem || {};

  // Get current matchday winners (for the latest resolved matchday)
  const latestMatchday = tournament.matchdayWinners?.[0]?.matchdayNumber;
  const currentWinners = tournament.matchdayWinners?.filter((w: MatchdayWinner) => w.matchdayNumber === latestMatchday) || [];
  const currentWinnerIds = currentWinners.map((w: MatchdayWinner) => w.userId);

  const ruleItems = [
    { id: '1', label: 'Resultado Exacto', value: points.exactMatch || points.exact, icon: 'star' },
    { id: '2', label: 'Resultado (1X2)', value: points.correctResult || points.result, icon: 'checkmark-done' },
    { id: '9', label: 'Ganador de Fecha (Liga)', value: points.matchdayWinner, icon: 'medal', condition: tournament.format === 'liga' },
    { id: '3', label: 'Goleador Correcto', value: points.topScorer, icon: 'football', condition: tournament.predictTopScorer },
    { id: '4', label: 'MVP Correcto', value: points.mvp, icon: 'trophy', condition: tournament.predictMvp },
    { id: '5', label: 'Arquero Correcto', value: points.goalkeeper, icon: 'hand-right', condition: tournament.predictGoalkeeper },
    { id: '6', label: '1º y 2º Orden Exacto', value: points.groupExact, icon: 'list', condition: tournament.predictGroups },
    { id: '7', label: '1º y 2º Cualquier Orden', value: points.groupBoth, icon: 'list-outline', condition: tournament.predictGroups },
    { id: '8', label: 'Un Clasificado', value: points.groupOne, icon: 'remove', condition: tournament.predictGroups },
  ].filter(item => item.condition !== false && item.value !== undefined);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* ── HEADER ── */}
        <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
            </TouchableOpacity>

            {currentUser?.id === tournament.creatorId && !tournament.competitionId && (
              <TouchableOpacity 
                style={[styles.backBtn, { backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.2)', borderWidth: 1 }]} 
                onPress={() => router.push(`/tournament/${id}/manage`)}
              >
                <Ionicons name="settings-outline" size={22} color="#EAB308" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.competitionName}>{tournament.competition?.name || 'Torneo Personalizado'}</Text>
            
            <TouchableOpacity style={styles.codeBadge} onPress={() => setShowShareModal(true)}>
              <Ionicons name="person-add-outline" size={16} color="#EAB308" style={{ marginRight: 8 }} />
              <Text style={styles.codeText}>INVITAR AL TORNEO</Text>
              <Ionicons name="chevron-forward" size={16} color="#EAB308" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── ACCIONES ── */}
        {/* ── ACCIONES ── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryActionBtn} 
            onPress={() => router.push(`/tournament/${id}/predict`)}
          >
            <LinearGradient colors={['#EAB308', '#CA8A04']} style={styles.primaryGradient}>
              <Ionicons name="football" size={22} color="#422006" />
              <Text style={styles.primaryActionBtnText}>PREDECIR</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity 
              style={styles.secondaryActionBtn}
              onPress={() => router.push(`/tournament/${id}/chat`)}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#94A3B8" />
              <Text style={styles.secondaryActionBtnText}>CHAT</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryActionBtn}
              onPress={() => setShowRules(true)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
              <Text style={styles.secondaryActionBtnText}>REGLAS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryActionBtn}
              onPress={() => router.push(`/tournament/${id}/share`)}
            >
              <Ionicons name="share-social-outline" size={20} color="#EAB308" />
              <Text style={[styles.secondaryActionBtnText, { color: '#EAB308' }]}>COMPARTIR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ESPECIALES BANNER ── */}
        {(tournament.predictMvp || tournament.predictTopScorer || tournament.predictGoalkeeper) && (
          <TouchableOpacity 
            style={styles.specialCard}
            onPress={() => router.push(`/tournament/${id}/outrights`)}
          >
            <LinearGradient 
              colors={['rgba(234, 179, 8, 0.15)', 'rgba(234, 179, 8, 0.05)']} 
              style={styles.specialGradient}
            >
              <View style={styles.specialTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="trophy" size={18} color="#EAB308" />
                  <Text style={styles.specialTitle}>Predicciones Especiales</Text>
                </View>
                <Text style={styles.specialSubtitle}>Elegí tu MVP, Goleador y Mejor Arquero</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EAB308" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── RANKING HEADER ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
          <View style={{ width: 36, alignItems: 'center' }}>
            <Text style={styles.headerText}>#</Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            <Text style={styles.headerText}>JUGADOR</Text>
          </View>
          <View style={{ width: 50, alignItems: 'center' }}>
            <Text style={styles.headerText}>PTS</Text>
          </View>
          <View style={{ width: 56, alignItems: 'center' }}>
            <Text style={styles.headerText}>E / C</Text>
          </View>
        </View>

        {/* ── RANKING LIST ── */}
        <View style={styles.rankingList}>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No hay participantes aún</Text>
          ) : (
            members.map((m: TournamentMember, index: number) => {
              const isCurrentWinner = currentWinnerIds.includes(m.userId);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}
                  activeOpacity={0.6}
                  onPress={() => router.push(`/tournament/${id}/user-predictions?userId=${m.userId}&username=${encodeURIComponent(m.user?.username || 'Usuario')}`)}
                >
                  <View style={{ width: 36, alignItems: 'center' }}>
                    <Text style={[{ fontSize: 14, fontWeight: '900', color: '#94A3B8' }, index < 3 && { color: '#EAB308', fontSize: 18 }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}>
                    {m.user?.avatarUrl ? (
                      <Image 
                        source={{ uri: m.user.avatarUrl }} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>
                          {(m.user?.username || 'U').substring(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={[{ fontSize: 14, fontWeight: '600', color: '#F8FAFC' }, index === 0 && { color: '#EAB308' }]} numberOfLines={1}>
                      {m.user?.username || 'Usuario'}
                    </Text>
                    {isCurrentWinner && (
                      <Text style={{ marginLeft: 6, fontSize: 14 }}>⭐</Text>
                    )}
                    {m.matchdayWins > 0 && !isCurrentWinner && (
                      <Text style={{ marginLeft: 6, fontSize: 10, color: '#64748B' }}>{m.matchdayWins}⭐</Text>
                    )}
                  </View>
                  <View style={{ width: 50, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#EAB308' }}>{m.totalPoints}</Text>
                  </View>
                  <View style={{ width: 56, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: '#94A3B8' }}>{m.exactResults} / {m.correctResults}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#334155" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={styles.tableLegend}>
          * E / C: Marcadores Exactos / Resultados Correctos (1X2) acertados
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── RULES MODAL ── */}
      <Modal visible={showRules} animationType="fade" transparent onRequestClose={() => setShowRules(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Reglas de Puntos</Text>
              <TouchableOpacity onPress={() => setShowRules(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: 'Resultado Exacto', value: points.exactMatch || points.exact, icon: 'star' },
                { label: 'Resultado (1X2)', value: points.correctResult || points.result, icon: 'checkmark-done' },
                { label: 'Ganador de Fecha', value: points.matchdayWinner, icon: 'medal', condition: tournament.format === 'liga' },
                { label: 'Goleador', value: points.topScorer, icon: 'football', condition: tournament.predictTopScorer },
                { label: 'MVP', value: points.mvp, icon: 'trophy', condition: tournament.predictMvp },
                { label: 'Valla Invicta', value: points.goalkeeper, icon: 'shield-checkmark', condition: tournament.predictGoalkeeper },
                { label: 'Clasificados (Orden Exacto)', value: points.groupExact, icon: 'list', condition: tournament.predictGroups },
                { label: 'Clasificados (Cualquier Orden)', value: points.groupBoth, icon: 'swap-horizontal', condition: tournament.predictGroups },
                { label: 'Solo un Clasificado', value: points.groupOne, icon: 'remove', condition: tournament.predictGroups },
              ].filter(item => item.value !== undefined && item.value !== null && item.condition !== false).map((item, index) => (
                <View key={index} style={modalStyles.ruleItem}>
                  <View style={modalStyles.ruleIcon}>
                    <Ionicons name={item.icon as any} size={20} color="#EAB308" />
                  </View>
                  <Text style={modalStyles.ruleLabel}>{item.label}</Text>
                  <View style={modalStyles.pointsBadge}>
                    <Text style={modalStyles.pointsText}>+{item.value}</Text>
                  </View>
                </View>
              ))}
              <Text style={modalStyles.footerNote}>
                * Los puntos se suman al finalizar cada partido u oficializar resultados de fase.{"\n\n"}
                * E / C en la tabla: Aciertos de marcador Exacto / Aciertos de resultado Ganador o Empate (Correcto).
              </Text>
            </ScrollView>

            <TouchableOpacity style={modalStyles.closeBtn} onPress={() => setShowRules(false)}>
              <Text style={modalStyles.closeBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── SHARE MODAL ── */}
      <Modal visible={showShareModal} animationType="fade" transparent onRequestClose={() => setShowShareModal(false)}>
        <View style={shareStyles.overlay}>
          <View style={shareStyles.container}>
            <View style={shareStyles.header}>
              <Text style={shareStyles.title}>Compartir Torneo</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={shareStyles.qrSection}>
              <View style={shareStyles.qrContainer}>
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`es-mi-prode://join/${tournament?.shareCode}`)}&bgcolor=0F172A&color=F8FAFC` }}
                  style={{ width: 180, height: 180 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={shareStyles.qrHint}>Escaneá este QR para unirte</Text>
              <View style={shareStyles.codePill}>
                <Text style={shareStyles.codePillText}>{tournament?.shareCode}</Text>
                <TouchableOpacity onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={18} color="#EAB308" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={shareStyles.actions}>
              <TouchableOpacity style={shareStyles.linkBtn} onPress={handleShareLink}>
                <Ionicons name="send-outline" size={20} color="#422006" />
                <Text style={shareStyles.linkBtnText}>ENVIAR INVITACIÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Trigger watch event to clear stale Metro bundler cache

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
    marginBottom: 16,
  },
  headerInfo: {
    alignItems: 'center',
  },
  tournamentName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 1,
  },
  competitionName: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  codeText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  primaryActionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EAB308',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryActionBtnText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rankingList: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  col: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  colRank: { width: 36, textAlign: 'center' },
  colName: { flex: 1, color: '#F8FAFC', fontWeight: '600', paddingHorizontal: 8 },
  colPts: { width: 50, textAlign: 'center', color: '#EAB308' },
  colStats: { width: 56, textAlign: 'center', fontSize: 12 },
  bold: { fontWeight: '900' },
  topThree: { color: '#EAB308', fontSize: 18 },
  winnerName: { color: '#EAB308' },
  rankBadgeContainer: {
    width: 36,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    padding: 40,
    fontStyle: 'italic',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
  },
  specialCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  specialGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specialTextCol: {
    flex: 1,
    gap: 4,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EAB308',
    letterSpacing: 0.5,
  },
  specialSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarFallbackText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableLegend: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ruleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ruleLabel: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
  },
  pointsBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  closeBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  closeBtnText: {
    color: '#422006',
    fontWeight: '900',
    letterSpacing: 1,
  },
});

const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    shadowColor: '#EAB308',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  qrHint: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  codePillText: {
    color: '#EAB308',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
  },
  actions: {
    gap: 12,
  },
  linkBtn: {
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#EAB308',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  linkBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
});

