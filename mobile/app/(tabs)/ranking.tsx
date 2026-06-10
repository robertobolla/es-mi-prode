import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

interface GlobalRankingItem {
  id: string;
  competitionId: string;
  userId: string;
  bestTournamentId: string;
  points: number;
  rank: number;
  username: string;
  avatarUrl: string | null;
}

interface CompetitionConfig {
  id: string;
  name: string;
  predictMvp: boolean;
  predictTopScorer: boolean;
  predictGoalkeeper: boolean;
  predictGroups: boolean;
  pointsSystem: {
    exactMatch?: number;
    exact?: number;
    correctResult?: number;
    result?: number;
    mvp?: number;
    topScorer?: number;
    goalkeeper?: number;
    groupExact?: number;
    groupBoth?: number;
    groupOne?: number;
  } | null;
}

interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface RankingsResponse {
  rankings: GlobalRankingItem[];
  myRanking: GlobalRankingItem | null;
  competition?: CompetitionConfig | null;
}

export default function GlobalRankingScreen() {
  const [rankings, setRankings] = useState<GlobalRankingItem[]>([]);
  const [myRanking, setMyRanking] = useState<GlobalRankingItem | null>(null);
  const [competition, setCompetition] = useState<CompetitionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const [profileData, rankingsData] = await Promise.all([
        api.get('/users/me').catch(() => null) as Promise<UserProfile | null>,
        api.get('/rankings/global').catch(() => ({ rankings: [], myRanking: null, competition: null })) as Promise<RankingsResponse>,
      ]);
      setProfile(profileData);
      setRankings(rankingsData?.rankings || []);
      setMyRanking(rankingsData?.myRanking || null);
      setCompetition(rankingsData?.competition || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  const ptsExactMatch = competition?.pointsSystem?.exactMatch ?? competition?.pointsSystem?.exact ?? 5;
  const ptsCorrectResult = competition?.pointsSystem?.correctResult ?? competition?.pointsSystem?.result ?? 3;
  const ptsMvp = competition?.pointsSystem?.mvp ?? 10;
  const ptsTopScorer = competition?.pointsSystem?.topScorer ?? 10;
  const ptsGoalkeeper = competition?.pointsSystem?.goalkeeper ?? 10;
  const ptsGroupExact = competition?.pointsSystem?.groupExact ?? 10;
  const ptsGroupBoth = competition?.pointsSystem?.groupBoth ?? 5;
  const ptsGroupOne = competition?.pointsSystem?.groupOne ?? 2;

  interface RuleItem {
    label: string;
    value: number;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    condition?: boolean;
  }

  const ruleItems: RuleItem[] = ([
    { label: 'Resultado Exacto', value: ptsExactMatch, icon: 'star' },
    { label: 'Resultado (1X2)', value: ptsCorrectResult, icon: 'checkmark-done' },
    { label: 'Goleador', value: ptsTopScorer, icon: 'football', condition: competition ? competition.predictTopScorer : true },
    { label: 'MVP', value: ptsMvp, icon: 'trophy', condition: competition ? competition.predictMvp : true },
    { label: 'Valla Invicta', value: ptsGoalkeeper, icon: 'shield-checkmark', condition: competition ? competition.predictGoalkeeper : true },
    { label: 'Clasificados (Orden Exacto)', value: ptsGroupExact, icon: 'list', condition: competition ? competition.predictGroups : true },
    { label: 'Clasificados (Cualquier Orden)', value: ptsGroupBoth, icon: 'swap-horizontal', condition: competition ? competition.predictGroups : true },
    { label: 'Solo un Clasificado', value: ptsGroupOne, icon: 'remove', condition: competition ? competition.predictGroups : true },
  ] as RuleItem[]).filter(item => item.condition !== false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking Global</Text>
        <Text style={styles.subtitle}>Top 100 mejores pronosticadores</Text>
        
        <TouchableOpacity 
          style={styles.rulesButton} 
          onPress={() => setShowRulesModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={18} color="#EAB308" />
          <Text style={styles.rulesButtonText}>REGLAS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#EAB308" style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Este ranking refleja las posiciones del torneo público oficial del <Text style={styles.boldText}>Mundial 2026</Text>, al cual te unís automáticamente al completar tu perfil.
        </Text>
      </View>

      {rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>El ranking se generará cuando{'\n'}los torneos comiencen</Text>
          <Text style={styles.emptySubtext}>Crea o únete a un torneo para empezar</Text>
        </View>
      ) : (
        <FlatList
          data={rankings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, item.userId === profile?.id && styles.highlightCard]}>
              <Text style={[styles.rank, item.rank === 1 && styles.gold]}>#{item.rank}</Text>
              {item.avatarUrl ? (
                <Image 
                  source={{ uri: item.avatarUrl }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {(item.username || 'U').substring(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.name, item.userId === profile?.id && styles.highlightText]}>{item.username}</Text>
              </View>
              <Text style={[styles.points, item.userId === profile?.id && styles.highlightText]}>{item.points} pts</Text>
            </View>
          )}
        />
      )}

      {myRanking && (
        <View style={styles.myRankingSticky}>
          <Text style={styles.myRankingLabel}>TU POSICIÓN GLOBAL</Text>
          <View style={[styles.card, styles.myRankingCard]}>
            <Text style={styles.myRankingRank}>#{myRanking.rank}</Text>
            {myRanking.avatarUrl ? (
              <Image 
                source={{ uri: myRanking.avatarUrl }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(myRanking.username || 'U').substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.myRankingName}>{myRanking.username} (Vos)</Text>
            </View>
            <Text style={styles.myRankingPoints}>{myRanking.points} pts</Text>
          </View>
        </View>
      )}

      <Modal
        visible={showRulesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reglas de Puntos</Text>
              <TouchableOpacity onPress={() => setShowRulesModal(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {ruleItems.map((item, index) => (
                <View key={index} style={styles.ruleItem}>
                  <View style={styles.ruleIcon}>
                    <Ionicons name={item.icon} size={20} color="#EAB308" />
                  </View>
                  <Text style={styles.ruleLabel}>{item.label}</Text>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{item.value}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.footerNote}>
                * Los puntos se calculan dinámicamente y se suman para determinar tu posición en el ranking global.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRulesModal(false)}>
              <Text style={styles.closeBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 14,
    gap: 12,
  },
  infoIcon: {
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  list: {
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  highlightCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8',
    width: 40,
  },
  gold: {
    color: '#EAB308',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  highlightText: {
    color: '#EAB308',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  myRankingSticky: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  myRankingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EAB308',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  myRankingCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    borderWidth: 1,
    marginBottom: 0,
  },
  myRankingRank: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EAB308',
    width: 60,
  },
  myRankingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  myRankingPoints: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EAB308',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
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
  modalBody: {
    paddingBottom: 24,
  },
  rulesButton: {
    position: 'absolute',
    right: 24,
    top: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  rulesButtonText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
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
});
