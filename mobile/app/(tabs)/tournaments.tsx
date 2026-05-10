import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, Modal, TextInput, Alert, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, FINISHED

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const data = await api.get('/tournaments/my');
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Error fetching tournaments:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    try {
      const comps = await api.get('/competitions');
      setCompetitions(Array.isArray(comps) ? comps : []);
      setShowCreate(true);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudieron cargar las competiciones. ¿Está corriendo el backend?');
    }
  };

  const deleteTournament = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Torneo',
      `¿Estás seguro de que querés eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tournaments/${id}`);
              fetchTournaments();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t: any) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(term);
      const codeMatch = t.shareCode?.toLowerCase().includes(term);
      if (!nameMatch && !codeMatch) return false;
    }
    // Status filter
    if (statusFilter === 'ACTIVE' && t.status === 'FINISHED') return false;
    if (statusFilter === 'FINISHED' && t.status !== 'FINISHED') return false;
    return true;
  });

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Torneos</Text>
      </View>
      <ActivityIndicator size="large" color="#EAB308" style={{ marginTop: 60 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Torneos</Text>
        <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
          <Text style={styles.createBtnText}>+ NUEVO</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersArea}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o código..."
            placeholderTextColor="#475569"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.chipRow}>
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'ACTIVE', label: 'Activos' },
            { key: 'FINISHED', label: 'Finalizados' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, statusFilter === f.key && styles.chipActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredTournaments.length}</Text>
          </View>
        </View>
      </View>

      {filteredTournaments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>
            {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron torneos' : 'Aún no participas en ningún torneo'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchTerm || statusFilter !== 'ALL' ? 'Probá con otros filtros' : 'Crea uno nuevo o únete con un código'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTournaments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push(`/tournament/${item.id}`)}
              onLongPress={() => deleteTournament(item.id, item.name)}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>
                      {item.memberCount || item._count?.members || 0} 👥
                    </Text>
                    <View style={[styles.statusDot, item.status === 'FINISHED' ? { backgroundColor: '#64748B' } : { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.cardMetaText}>
                      {item.status === 'FINISHED' ? 'Finalizado' : 'Activo'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.rankValue, item.myRank === 1 && styles.gold]}>
                    {item.myRank ? `#${item.myRank}` : '-'}
                  </Text>
                  <Text style={styles.ptsValue}>{item.myPoints || 0} pts</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <CreateTournamentModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        competitions={competitions}
        onCreated={() => {
          setShowCreate(false);
          setLoading(true);
          fetchTournaments();
        }}
      />
    </View>
  );
}

function CreateTournamentModal({ visible, onClose, competitions, onCreated }: any) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [selectedCompId, setSelectedCompId] = useState('');
  const [loading, setLoading] = useState(false);

  // New fields
  const [maxParticipants, setMaxParticipants] = useState('');
  const [creatorParticipates, setCreatorParticipates] = useState(true);
  const [includeExtraTime, setIncludeExtraTime] = useState(false);
  const [predictMvp, setPredictMvp] = useState(false);
  const [predictTopScorer, setPredictTopScorer] = useState(false);
  const [predictGoalkeeper, setPredictGoalkeeper] = useState(false);
  const [predictGroups, setPredictGroups] = useState(true);

  // Points System
  const [ptsExact, setPtsExact] = useState('5');
  const [ptsResult, setPtsResult] = useState('3');
  const [ptsMvp, setPtsMvp] = useState('10');
  const [ptsTopScorer, setPtsTopScorer] = useState('10');
  const [ptsGoalkeeper, setPtsGoalkeeper] = useState('10');
  const [ptsGroupExact, setPtsGroupExact] = useState('10');
  const [ptsGroupBoth, setPtsGroupBoth] = useState('5');
  const [ptsGroupOne, setPtsGroupOne] = useState('2');

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del torneo es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await api.post('/tournaments', {
        name: name.trim(),
        ...(selectedCompId ? { competitionId: selectedCompId } : {}),
        isPublic,
        password: !isPublic ? password : undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        creatorParticipates,
        includeExtraTime,
        predictMvp,
        predictTopScorer,
        predictGoalkeeper,
        predictGroups,
        pointsSystem: {
          exactMatch: parseInt(ptsExact) || 5,
          correctResult: parseInt(ptsResult) || 3,
          mvp: parseInt(ptsMvp) || 10,
          topScorer: parseInt(ptsTopScorer) || 10,
          goalkeeper: parseInt(ptsGoalkeeper) || 10,
          groupExact: parseInt(ptsGroupExact) || 10,
          groupBoth: parseInt(ptsGroupBoth) || 5,
          groupOne: parseInt(ptsGroupOne) || 2,
        },
      });
      const successMsg = selectedCompId 
        ? 'Torneo creado. ¡Invitá a tus amigos para empezar a predecir!'
        : 'Torneo creado. Ahora podés agregar equipos, fases y partidos desde la pantalla del torneo.';
      
      Alert.alert('¡Éxito!', successMsg);
      onCreated();
      // Reset
      setName(''); setIsPublic(true); setPassword(''); setSelectedCompId('');
      setMaxParticipants(''); setCreatorParticipates(true); setIncludeExtraTime(false);
      setPredictMvp(false); setPredictTopScorer(false); setPredictGoalkeeper(false); setPredictGroups(true);
      setPtsExact('5'); setPtsResult('3'); setPtsMvp('10'); setPtsTopScorer('10'); setPtsGoalkeeper('10');
      setPtsGroupExact('10'); setPtsGroupBoth('5'); setPtsGroupOne('2');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el torneo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={modalStyles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={modalStyles.container}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.title}>Crear Torneo</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={modalStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── DATOS BASE ── */}
            <Text style={modalStyles.sectionHeader}>📋 DATOS BASE</Text>

            <Text style={modalStyles.label}>Nombre del Torneo</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Ej: Los Pibes del Barrio"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
              maxLength={40}
            />

            <Text style={modalStyles.label}>Competición</Text>
            <View style={modalStyles.compList}>
              {competitions.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={[modalStyles.compItem, selectedCompId === c.id && modalStyles.compItemSelected]}
                  onPress={() => setSelectedCompId(c.id)}
                >
                  <Text style={[modalStyles.compText, selectedCompId === c.id && modalStyles.compTextSelected]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[modalStyles.compItem, !selectedCompId && modalStyles.compItemSelected]}
                onPress={() => setSelectedCompId('')}
              >
                <Text style={[modalStyles.compText, !selectedCompId && modalStyles.compTextSelected]}>
                  Personalizado
                </Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Torneo Público</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            {!isPublic && (
              <TextInput
                style={[modalStyles.input, { marginTop: 8 }]}
                placeholder="Contraseña para unirse"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Creador participa</Text>
              <Switch value={creatorParticipates} onValueChange={setCreatorParticipates} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            <Text style={modalStyles.label}>Máximo de participantes</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Vacío = ilimitado"
              placeholderTextColor="#64748B"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
            />

            {/* ── REGLAS ── */}
            <Text style={modalStyles.sectionHeader}>⚙️ REGLAS</Text>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Contar tiempo extra</Text>
              <Switch value={includeExtraTime} onValueChange={setIncludeExtraTime} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Predecir MVP</Text>
              <Switch value={predictMvp} onValueChange={setPredictMvp} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Predecir Goleador</Text>
              <Switch value={predictTopScorer} onValueChange={setPredictTopScorer} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Predecir Mejor Arquero</Text>
              <Switch value={predictGoalkeeper} onValueChange={setPredictGoalkeeper} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            <View style={modalStyles.switchRow}>
              <Text style={modalStyles.switchLabel}>Predecir Clasificados (1º y 2º)</Text>
              <Switch value={predictGroups} onValueChange={setPredictGroups} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
            </View>

            {/* ── SISTEMA DE PUNTOS ── */}
            <Text style={modalStyles.sectionHeader}>🏆 SISTEMA DE PUNTOS</Text>

            <View style={modalStyles.pointsRow}>
              <Text style={modalStyles.pointsLabel}>Resultado exacto</Text>
              <TextInput style={modalStyles.pointsInput} value={ptsExact} onChangeText={setPtsExact} keyboardType="numeric" />
            </View>
            <View style={modalStyles.pointsRow}>
              <Text style={modalStyles.pointsLabel}>Solo resultado (1X2)</Text>
              <TextInput style={modalStyles.pointsInput} value={ptsResult} onChangeText={setPtsResult} keyboardType="numeric" />
            </View>
            {predictMvp && (
              <View style={modalStyles.pointsRow}>
                <Text style={modalStyles.pointsLabel}>MVP correcto</Text>
                <TextInput style={modalStyles.pointsInput} value={ptsMvp} onChangeText={setPtsMvp} keyboardType="numeric" />
              </View>
            )}
            {predictTopScorer && (
              <View style={modalStyles.pointsRow}>
                <Text style={modalStyles.pointsLabel}>Goleador correcto</Text>
                <TextInput style={modalStyles.pointsInput} value={ptsTopScorer} onChangeText={setPtsTopScorer} keyboardType="numeric" />
              </View>
            )}
            {predictGoalkeeper && (
              <View style={modalStyles.pointsRow}>
                <Text style={modalStyles.pointsLabel}>Arquero correcto</Text>
                <TextInput style={modalStyles.pointsInput} value={ptsGoalkeeper} onChangeText={setPtsGoalkeeper} keyboardType="numeric" />
              </View>
            )}

            {predictGroups && (
              <>
                <View style={modalStyles.pointsRow}>
                  <Text style={modalStyles.pointsLabel}>1º y 2º en orden exacto</Text>
                  <TextInput style={modalStyles.pointsInput} value={ptsGroupExact} onChangeText={setPtsGroupExact} keyboardType="numeric" />
                </View>
                <View style={modalStyles.pointsRow}>
                  <Text style={modalStyles.pointsLabel}>1º y 2º en cualquier orden</Text>
                  <TextInput style={modalStyles.pointsInput} value={ptsGroupBoth} onChangeText={setPtsGroupBoth} keyboardType="numeric" />
                </View>
                <View style={modalStyles.pointsRow}>
                  <Text style={modalStyles.pointsLabel}>Solo uno correcto</Text>
                  <TextInput style={modalStyles.pointsInput} value={ptsGroupOne} onChangeText={setPtsGroupOne} keyboardType="numeric" />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[modalStyles.createBtn, loading && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#422006" />
              ) : (
                <Text style={modalStyles.createBtnText}>CREAR TORNEO</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  createBtn: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#EAB308',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  createBtnText: {
    color: '#422006',
    fontWeight: '900',
    letterSpacing: 1,
  },
  centered: {
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
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  filtersArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#020617',
  },
  searchRow: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  chipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#EAB308',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  countText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    color: '#64748B',
    fontSize: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardRight: {
    alignItems: 'center',
    paddingLeft: 12,
  },
  rankValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  ptsValue: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  gold: {
    color: '#EAB308',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 24,
    padding: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
  },
  noData: {
    color: '#64748B',
    fontStyle: 'italic',
    padding: 12,
  },
  compList: {
    gap: 8,
  },
  compItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compItemSelected: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  compText: {
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  compTextSelected: {
    color: '#EAB308',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EAB308',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsLabel: {
    color: '#94A3B8',
    fontSize: 14,
    flex: 1,
  },
  pointsInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 18,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
  createBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#EAB308',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  createBtnText: {
    color: '#422006',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
