import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share, Modal, Clipboard, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const data = await api.get(`/tournaments/${id}`);
      setTournament(data);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cargar la información del torneo');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!tournament) return;
    try {
      const { API_URL } = await import('../../../lib/api');
      const shareUrl = `${API_URL}/invitations/join/${tournament.shareCode}`;
      
      await Share.share({
        message: `¡Sumate a mi prode "${tournament.name}"!\n\nUnite haciendo clic acá:\n${shareUrl}\n\nCódigo: ${tournament.shareCode}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
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

  const ruleItems = [
    { id: '1', label: 'Resultado Exacto', value: points.exact, icon: 'star' },
    { id: '2', label: 'Resultado (1X2)', value: points.result, icon: 'checkmark-done' },
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          
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
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push(`/tournament/${id}/predict`)}
          >
            <LinearGradient colors={['#EAB308', '#CA8A04']} style={styles.actionGradient}>
              <Ionicons name="football" size={24} color="#422006" />
              <Text style={styles.actionBtnText}>PREDECIR</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnSecondary}
            onPress={() => router.push(`/tournament/${id}/chat`)}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#94A3B8" />
            <Text style={styles.actionBtnTextSec}>CHAT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnSecondary}
            onPress={() => setShowRules(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color="#94A3B8" />
            <Text style={styles.actionBtnTextSec}>REGLAS</Text>
          </TouchableOpacity>
        </View>

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
            members.map((m: any, index: number) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
                <View style={{ width: 36, alignItems: 'center' }}>
                  <Text style={[{ fontSize: 14, fontWeight: '900', color: '#94A3B8' }, index < 3 && { color: '#EAB308', fontSize: 18 }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 8 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '600', color: '#F8FAFC' }, index === 0 && { color: '#EAB308' }]} numberOfLines={1}>
                    {m.user?.username || 'Usuario'}
                  </Text>
                </View>
                <View style={{ width: 50, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#EAB308' }}>{m.totalPoints}</Text>
                </View>
                <View style={{ width: 56, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8' }}>{m.exactResults} / {m.correctResults}</Text>
                </View>
              </View>
            ))
          )}
        </View>

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
                { label: 'Goleador', value: points.topScorer, icon: 'football' },
                { label: 'MVP', value: points.mvp, icon: 'trophy' },
                { label: 'Valla Invicta', value: points.goalkeeper, icon: 'shield-checkmark' },
                { label: 'Clasificados (Orden Exacto)', value: points.groupExact, icon: 'list' },
                { label: 'Clasificados (Cualquier Orden)', value: points.groupBoth, icon: 'swap-horizontal' },
                { label: 'Solo un Clasificado', value: points.groupOne, icon: 'remove' },
              ].filter(item => item.value !== undefined && item.value !== null).map((item, index) => (
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
                * Los puntos se suman al finalizar cada partido u oficializar resultados de fase.
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
  actionsRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 2,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnTextSec: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
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
