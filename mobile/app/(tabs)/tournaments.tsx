import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator, Modal, TextInput, Alert, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';

const { width } = Dimensions.get('window');

interface Competition {
  id: string;
  name: string;
  format?: string;
}

interface Tournament {
  id: string;
  name: string;
  shareCode?: string;
  status: string;
  format: string;
  myRank?: number;
  myPoints?: number;
  memberCount?: number;
  _count?: {
    members: number;
  };
}

interface UserProfile {
  id: string;
  supabaseId: string;
  username: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
}

interface PurchasesProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

interface CreateTournamentModalProps {
  visible: boolean;
  onClose: () => void;
  competitions: Competition[];
  onCreated: () => void;
}

export default function TournamentsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, FINISHED

  const { data: tournaments = [], isLoading: loading, refetch: fetchTournaments } = useQuery<Tournament[]>({
    queryKey: ['my_tournaments'],
    queryFn: async () => {
      const data = await api.get('/tournaments/my');
      return Array.isArray(data) ? data : [];
    },
  });

  const openCreateModal = async () => {
    try {
      const comps = await api.get('/competitions');
      setCompetitions(Array.isArray(comps) ? comps : []);
      setShowCreate(true);
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', err.message || 'No se pudieron cargar las competiciones. ¿Está corriendo el backend?');
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
            } catch (e) {
              const err = e as Error;
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t: Tournament) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.trim().toLowerCase();
      const nameMatch = t.name?.toLowerCase().includes(term);
      const codeMatch = t.shareCode?.toLowerCase() === term;
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
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#020617' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
                      <View style={styles.vDivider} />
                      <Text style={styles.cardMetaText}>
                        {item.format === 'liga' ? '📅 Liga' : '🏆 Copa'}
                      </Text>
                      <View style={styles.vDivider} />
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
            fetchTournaments();
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function CreateTournamentModal({ visible, onClose, competitions, onCreated }: CreateTournamentModalProps) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [selectedCompId, setSelectedCompId] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('copa'); // 'copa' or 'liga'
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [localPrice, setLocalPrice] = useState('$7.99');

  // Fetch local price from App Store / Google Play via RevenueCat
  useEffect(() => {
    if (visible) {
      const isConfigured = ((globalThis as unknown) as { purchasesConfigured?: boolean }).purchasesConfigured === true;
      if (!isConfigured) {
        console.log('💳 [RevenueCat] SDK no configurado (probablemente en Expo Go). Usando precio default $7.99.');
        return;
      }

      Purchases.getProducts(['com.esmi.prode.crear_torneo'])
        .then((products: PurchasesProduct[]) => {
          if (products && products.length > 0) {
            setLocalPrice(products[0].priceString);
          }
        })
        .catch((err) => {
          const error = err as Error;
          console.error('Error fetching IAP product price:', error);
        });
    }
  }, [visible]);

  // Sync profile when visible
  useEffect(() => {
    if (visible) {
      api.get('/users/me')
        .then((data) => setProfile(data as UserProfile))
        .catch((err) => {
          const error = err as Error;
          console.error('Error fetching profile:', error);
        });
    }
  }, [visible]);

  // Sync format with official competition if selected
  useEffect(() => {
    if (selectedCompId) {
      const comp = competitions.find((c: Competition) => c.id === selectedCompId);
      if (comp?.format) {
        setFormat(comp.format);
      }
    }
  }, [selectedCompId, competitions]);

  // New fields
  const [roundTrip, setRoundTrip] = useState(false);
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
  const [ptsMatchdayWinner, setPtsMatchdayWinner] = useState('3');
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

    let transactionId: string | undefined = undefined;

    // Trigger purchase if user is not admin
    if (profile && !profile.isAdmin) {
      const isConfigured = ((globalThis as unknown) as { purchasesConfigured?: boolean }).purchasesConfigured === true;
      
      if (!isConfigured) {
        if (__DEV__) {
          console.log('⚠️ [RevenueCat] Simulando pago en modo desarrollo (Expo Go/Falta Configuración)...');
          transactionId = 'mock_transaction_expo_go_' + Date.now();
          Alert.alert('Modo Desarrollo', 'Simulando pago de torneo de forma exitosa ($7.99 USD) para desarrollo en Expo Go.');
        } else {
          setLoading(false);
          Alert.alert('Error de Configuración', 'El sistema de pagos no está configurado correctamente en este dispositivo.');
          return;
        }
      } else {
        try {
          console.log('💳 [RevenueCat] Iniciando compra de com.esmi.prode.crear_torneo...');
          const purchaseResult = await Purchases.purchaseProduct('com.esmi.prode.crear_torneo');
          transactionId = purchaseResult.transaction.transactionIdentifier;
          if (!transactionId) {
            throw new Error('No se recibió un identificador de transacción válido.');
          }
          console.log('💳 [RevenueCat] Compra exitosa. ID:', transactionId);
        } catch (e) {
          setLoading(false);
          const purchaseError = e as { userCancelled?: boolean; message?: string };
          if (purchaseError.userCancelled) {
            Alert.alert('Creación cancelada', 'Para crear el torneo debes completar el pago.');
          } else {
            Alert.alert('Error de pago', purchaseError.message || 'No se pudo procesar el pago.');
          }
          return;
        }
      }
    }

    try {
      await api.post('/tournaments', {
        name: name.trim(),
        ...(selectedCompId ? { competitionId: selectedCompId } : {}),
        isPublic,
        password: !isPublic ? password : undefined,
        format,
        roundTrip: format === 'liga' ? roundTrip : false,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        creatorParticipates,
        includeExtraTime: format === 'liga' ? false : includeExtraTime,
        predictMvp,
        predictTopScorer,
        predictGoalkeeper,
        predictGroups: format === 'liga' ? false : predictGroups,
        pointsSystem: {
          exactMatch: parseInt(ptsExact) || 5,
          correctResult: parseInt(ptsResult) || 3,
          matchdayWinner: format === 'liga' ? (parseInt(ptsMatchdayWinner) || 3) : undefined,
          mvp: parseInt(ptsMvp) || 10,
          topScorer: parseInt(ptsTopScorer) || 10,
          goalkeeper: parseInt(ptsGoalkeeper) || 10,
          groupExact: parseInt(ptsGroupExact) || 10,
          groupBoth: parseInt(ptsGroupBoth) || 5,
          groupOne: parseInt(ptsGroupOne) || 2,
        },
        paymentTransactionId: transactionId,
      });
      const successMsg = selectedCompId 
        ? 'Torneo creado. ¡Invitá a tus amigos para empezar a predecir!'
        : 'Torneo creado. Ahora podés agregar equipos, fases y partidos desde la pantalla del torneo.';
      
      Alert.alert('¡Éxito!', successMsg);
      onCreated();
      // Reset
      setName(''); setIsPublic(true); setPassword(''); setSelectedCompId('');
      setFormat('copa'); setRoundTrip(false);
      setMaxParticipants(''); setCreatorParticipates(true); setIncludeExtraTime(false);
      setPredictMvp(false); setPredictTopScorer(false); setPredictGoalkeeper(false); setPredictGroups(true);
      setPtsExact('5'); setPtsResult('3'); setPtsMatchdayWinner('3'); setPtsMvp('10'); setPtsTopScorer('10'); setPtsGoalkeeper('10');
      setPtsGroupExact('10'); setPtsGroupBoth('5'); setPtsGroupOne('2');
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', err.message || 'No se pudo crear el torneo');
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

            {profile && !profile.isAdmin && (
              <View style={modalStyles.iapNoticeCard}>
                <Text style={modalStyles.iapNoticeTitle}>✨ Torneo Premium</Text>
                <Text style={modalStyles.iapNoticeDescription}>
                  La creación de torneos tiene un valor de <Text style={{ fontWeight: 'bold', color: '#EAB308' }}>{localPrice}</Text>. El pago es por única vez y te permite jugar con tus amigos sin límites de participantes ni de predicciones.
                </Text>
              </View>
            )}

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

            {!selectedCompId && (
              <View style={{ marginTop: 10, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={[modalStyles.sectionHeader, { marginTop: 0, borderTopWidth: 0, paddingTop: 0 }]}>🏆 FORMATO DEL TORNEO</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={[modalStyles.formatBtn, format === 'copa' && modalStyles.formatBtnActive]}
                    onPress={() => setFormat('copa')}
                  >
                    <Text style={[modalStyles.formatBtnText, format === 'copa' && modalStyles.formatBtnTextActive]}>🏆 COPA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[modalStyles.formatBtn, format === 'liga' && modalStyles.formatBtnActive]}
                    onPress={() => setFormat('liga')}
                  >
                    <Text style={[modalStyles.formatBtnText, format === 'liga' && modalStyles.formatBtnTextActive]}>📅 LIGA</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 10, lineHeight: 18, textAlign: 'center' }}>
                  {format === 'copa' 
                    ? 'Ideal para torneos cortos con eliminación directa.' 
                    : 'Todos contra todos. Los participantes suman puntos en cada fecha.'}
                </Text>
              </View>
            )}

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

            {format === 'liga' && (
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.switchLabel}>Torneo Ida y Vuelta</Text>
                <Switch value={roundTrip} onValueChange={setRoundTrip} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
              </View>
            )}

            {format === 'copa' && (
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.switchLabel}>Contar tiempo extra</Text>
                <Switch value={includeExtraTime} onValueChange={setIncludeExtraTime} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
              </View>
            )}

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

            {format === 'copa' && (
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.switchLabel}>Predecir Clasificados (1º y 2º)</Text>
                <Switch value={predictGroups} onValueChange={setPredictGroups} trackColor={{ false: '#334155', true: '#EAB308' }} thumbColor="#FFF" />
              </View>
            )}

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
            {format === 'liga' && (
              <View style={modalStyles.pointsRow}>
                <Text style={modalStyles.pointsLabel}>Ganador de la fecha (Bonus)</Text>
                <TextInput style={modalStyles.pointsInput} value={ptsMatchdayWinner} onChangeText={setPtsMatchdayWinner} keyboardType="numeric" />
              </View>
            )}
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

            {format === 'copa' && predictGroups && (
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
                <Text style={modalStyles.createBtnText}>
                  {profile && !profile.isAdmin ? `PAGAR Y CREAR TORNEO (${localPrice})` : 'CREAR TORNEO'}
                </Text>
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
  vDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
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
  iapNoticeCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  iapNoticeTitle: {
    color: '#EAB308',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  iapNoticeDescription: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
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
  formatBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  formatBtnActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  formatBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  formatBtnTextActive: {
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
