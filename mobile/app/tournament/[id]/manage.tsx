import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image as RNImage } from 'react-native';

interface CustomTeam {
  id: string;
  name: string;
  logoUrl?: string;
}

interface CustomMatch {
  id: string;
  phaseId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  homeTeam?: CustomTeam;
  awayTeam?: CustomTeam;
  phaseName?: string;
}

interface CustomPhase {
  id: string;
  name: string;
  order: number;
  matches: CustomMatch[];
}

interface CustomTournament {
  id: string;
  name: string;
  format: 'liga' | 'copa';
  customTeams: CustomTeam[];
  customPhases: CustomPhase[];
  matchdayWinners: any[];
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  onAdd?: () => void;
}

function Select({ label, value, options, onSelect, onAdd }: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TouchableOpacity 
          style={styles.selectBox} 
          onPress={() => setOpen(true)}
        >
          <Text style={styles.selectText}>{value}</Text>
          <Ionicons name="chevron-down" size={18} color="#94A3B8" />
        </TouchableOpacity>
        {onAdd && (
          <TouchableOpacity 
            style={styles.addIconBtn}
            onPress={onAdd}
          >
            <Ionicons name="add" size={24} color="#EAB308" />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownHeader}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt) => (
                <TouchableOpacity 
                  key={opt.value} 
                  style={styles.dropdownItem} 
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, value === opt.label && styles.dropdownItemTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function ManageTournamentScreen() {
  const { id } = useLocalSearchParams();
  const [tournament, setTournament] = useState<CustomTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EQUIPOS' | 'FASES' | 'PARTIDOS'>('EQUIPOS');

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      console.log('📡 Fetching tournament data for management...');
      const data = await api.get(`/tournaments/${id}`);
      setTournament(data);
    } catch (e) {
      console.error('❌ Error fetching tournament:', e);
      Alert.alert('Error', 'No se pudo cargar la información');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#EAB308" />
    </View>
  );

  if (!tournament) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Torneo</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsRow}>
        {(['EQUIPOS', tournament.format !== 'liga' && 'FASES', 'PARTIDOS'] as const)
          .filter((t): t is 'EQUIPOS' | 'FASES' | 'PARTIDOS' => !!t)
          .map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'EQUIPOS' && <TeamsManager tournament={tournament} onUpdate={fetchTournament} />}
        {activeTab === 'FASES' && tournament.format !== 'liga' && <PhasesManager tournament={tournament} onUpdate={fetchTournament} />}
        {activeTab === 'PARTIDOS' && <MatchesManager tournament={tournament} onUpdate={fetchTournament} />}
      </ScrollView>
    </View>
  );
}

interface ManagerProps {
  tournament: CustomTournament;
  onUpdate: () => void;
}

function TeamsManager({ tournament, onUpdate }: ManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<CustomTeam | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTeam) {
      setName(editingTeam.name);
      setLogoUri(editingTeam.logoUrl || null);
      setShowAdd(true);
    } else {
      setName('');
      setLogoUri(null);
    }
  }, [editingTeam]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      let teamId = editingTeam?.id;
      
      if (editingTeam) {
        await api.patch(`/tournaments/${tournament.id}/teams/${editingTeam.id}`, { name: name.trim() });
      } else {
        const newTeam = await api.post(`/tournaments/${tournament.id}/teams`, { name: name.trim() });
        teamId = newTeam.id;
      }

      // If a new image was picked, upload it
      if (logoUri && (!editingTeam || logoUri !== editingTeam.logoUrl)) {
        const formData = new FormData();
        const filename = logoUri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('logo', {
          uri: logoUri,
          name: filename,
          type,
        } as any);

        await api.post(`/tournaments/${tournament.id}/teams/${teamId}/logo`, formData);
      }

      setName('');
      setLogoUri(null);
      setEditingTeam(null);
      setShowAdd(false);
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (teamId: string) => {
    Alert.alert('Eliminar Equipo', '¿Estás seguro?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/tournaments/${tournament.id}/teams/${teamId}`);
          onUpdate();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Ionicons name="add-circle" size={24} color="#422006" />
        <Text style={styles.addBtnText}>AGREGAR EQUIPO</Text>
      </TouchableOpacity>

      {(!tournament.customTeams || tournament.customTeams.length === 0) && (
        <View style={styles.centered}>
          <Text style={{ color: '#64748B', marginTop: 20, fontStyle: 'italic' }}>No hay equipos cargados aún</Text>
        </View>
      )}

      {tournament.customTeams?.map((team) => (
        <View key={team.id} style={styles.listItem}>
          <RNImage 
            source={{ uri: team.logoUrl || 'https://via.placeholder.com/40' }} 
            style={styles.teamThumb} 
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{team.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={() => setEditingTeam(team)}>
              <Ionicons name="pencil-outline" size={20} color="#EAB308" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(team.id)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</Text>
            
            <TouchableOpacity style={styles.logoPicker} onPress={pickImage}>
              {logoUri ? (
                <RNImage source={{ uri: logoUri }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#64748B" />
                  <Text style={styles.logoPickerText}>Subir Escudo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Nombre del equipo"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => {
                setShowAdd(false);
                setEditingTeam(null);
              }}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAdd} disabled={loading}>
                {loading ? <ActivityIndicator color="#422006" /> : <Text style={styles.modalSubmitText}>{editingTeam ? 'ACTUALIZAR' : 'GUARDAR'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PhasesManager({ tournament, onUpdate }: ManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post(`/tournaments/${tournament.id}/phases`, { 
        name: name.trim(),
        order: (tournament.customPhases?.length || 0) + 1
      });
      setName('');
      setShowAdd(false);
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixtures = async () => {
    Alert.alert(
      'Generar Fixture',
      'Esto borrará todas las fases y partidos actuales para crear un fixture de liga "Todos contra Todos". ¿Continuar?',
      [
        { text: 'Cancelar' },
        { text: 'Generar', onPress: async () => {
          try {
            setLoading(true);
            await api.post(`/tournaments/${tournament.id}/generate-fixtures`, {});
            onUpdate();
          } catch (e: any) { Alert.alert('Error', e.message); }
          finally { setLoading(false); }
        }}
      ]
    );
  };

  const handleFinalizePhase = async (phaseId: string) => {
    Alert.alert(
      'Finalizar Fecha',
      '¿Deseas cerrar oficialmente esta fecha y calcular los ganadores? Asegúrate de que todos los resultados estén cargados.',
      [
        { text: 'Cancelar' },
        { text: 'Finalizar', onPress: async () => {
          try {
            setLoading(true);
            await api.post(`/tournaments/${tournament.id}/phases/${phaseId}/finalize`, {});
            Alert.alert('¡Éxito!', 'Fecha finalizada y ganadores calculados');
            onUpdate();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.addBtn, { flex: 1 }]} onPress={() => setShowAdd(true)}>
          <Ionicons name="layers-outline" size={24} color="#422006" />
          <Text style={styles.addBtnText}>NUEVA FASE</Text>
        </TouchableOpacity>
        
        {tournament.format === 'liga' && (
          <TouchableOpacity style={[styles.addBtn, { flex: 1, backgroundColor: '#3B82F6' }]} onPress={handleGenerateFixtures}>
            <Ionicons name="flash-outline" size={24} color="#FFF" />
            <Text style={[styles.addBtnText, { color: '#FFF' }]}>FIXTURE AUTO</Text>
          </TouchableOpacity>
        )}
      </View>

      {tournament.customPhases?.map((phase) => (
        <View key={phase.id} style={styles.listItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{phase.name}</Text>
            <Text style={styles.itemSub}>{phase.matches?.length || 0} partidos</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => handleFinalizePhase(phase.id)}>
              <Ionicons name="ribbon-outline" size={24} color="#EAB308" />
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              Alert.alert('Eliminar Fase', '¿Borrar esta fase y todos sus partidos?', [
                { text: 'Cancelar' },
                { text: 'Eliminar', style: 'destructive', onPress: async () => {
                  try {
                    await api.delete(`/tournaments/${tournament.id}/phases/${phase.id}`);
                    onUpdate();
                  } catch (e: any) { Alert.alert('Error', e.message); }
                }}
              ]);
            }}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nueva Fase / Fecha</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Fecha 1 o Cuartos"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAdd} disabled={loading}>
                {loading ? <ActivityIndicator color="#422006" /> : <Text style={styles.modalSubmitText}>GUARDAR</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MatchesManager({ tournament, onUpdate }: ManagerProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showResult, setShowResult] = useState<CustomMatch | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedPhase, setSelectedPhase] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [matchDate, setMatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [matchdayNumber, setMatchdayNumber] = useState('1');

  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const currentPhase = tournament.customPhases?.[currentPhaseIndex];

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(matchDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setMatchDate(newDate);
      setTimeout(() => setShowTimePicker(true), 100);
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(matchDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setMatchDate(newDate);
    }
  };

  const handleAddMatch = async () => {
    if (!homeTeam || !awayTeam) return;
    
    let phaseIdToUse = selectedPhase;

    setLoading(true);
    try {
      if (tournament.format === 'liga') {
        const fechaName = `Fecha ${matchdayNumber}`;
        let existingPhase = tournament.customPhases?.find((p) => p.name === fechaName);
        
        if (!existingPhase) {
          const res = await api.post(`/tournaments/${tournament.id}/phases`, {
            name: fechaName,
            order: parseInt(matchdayNumber) || 1,
            type: 'matchday'
          });
          existingPhase = res as CustomPhase;
        }
        phaseIdToUse = existingPhase.id;
      }

      if (!phaseIdToUse) {
        Alert.alert('Error', 'Debés seleccionar o indicar una fecha/fase');
        return;
      }

      await api.post(`/tournaments/${tournament.id}/matches`, {
        phaseId: phaseIdToUse,
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
        matchDate: matchDate.toISOString(),
      });
      setShowAdd(false);
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    Alert.alert('Eliminar Partido', '¿Estás seguro de que querés borrar este partido?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/tournaments/${tournament.id}/matches/${matchId}`);
          onUpdate();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const handleUpdateResult = async () => {
    if (!showResult || homeScore === '' || awayScore === '') return;
    setLoading(true);
    try {
      await api.patch(`/tournaments/${tournament.id}/matches/${showResult.id}/result`, {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
      });
      setShowResult(null);
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixtures = async () => {
    Alert.alert('Generar Fixture', '¿Borrar actuales y generar fixture automático?', [
      { text: 'Cancelar' },
      { text: 'Generar', onPress: async () => {
        try {
          setLoading(true);
          await api.post(`/tournaments/${tournament.id}/generate-fixtures`, {});
          onUpdate();
        } catch (e: any) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
      }}
    ]);
  };

  const handleFinalizePhase = async () => {
    if (!currentPhase) return;
    Alert.alert(
      'Finalizar Fecha',
      `¿Deseas cerrar oficialmente "${currentPhase.name}" y calcular los ganadores? Asegúrate de que todos los resultados estén cargados.`,
      [
        { text: 'Cancelar' },
        { text: 'Finalizar', onPress: async () => {
          try {
            setLoading(true);
            await api.post(`/tournaments/${tournament.id}/phases/${currentPhase.id}/finalize`, {});
            Alert.alert('¡Éxito!', 'Fecha finalizada y ganadores calculados');
            onUpdate();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        }}
      ]
    );
  };

  const currentMatches = currentPhase?.matches || [];

  return (
    <View>
      <View style={{ marginBottom: 20, gap: 10 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => {
          if (!tournament.customTeams?.length || tournament.customTeams.length < 2) {
            Alert.alert('Aviso', 'Primero debés cargar al menos dos equipos');
            return;
          }
          if (tournament.format !== 'liga' && !tournament.customPhases?.length) {
            Alert.alert('Aviso', 'Primero debés crear al menos una fase');
            return;
          }
          setSelectedPhase(tournament.customPhases?.[0]?.id || '');
          setShowAdd(true);
        }}>
          <Ionicons name="calendar-outline" size={22} color="#422006" />
          <Text style={styles.addBtnText}>AGREGAR PARTIDO MANUAL</Text>
        </TouchableOpacity>

        {tournament.format === 'liga' && (!tournament.customPhases || tournament.customPhases.length === 0) && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#3B82F6', marginBottom: 0 }]} onPress={handleGenerateFixtures} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="flash-outline" size={22} color="#FFF" />
                <Text style={[styles.addBtnText, { color: '#FFF' }]}>GENERAR FIXTURE AUTOMÁTICO</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de Fases */}
      {tournament.customPhases && tournament.customPhases.length > 0 && (
        <View style={styles.phaseSelector}>
          <TouchableOpacity 
            style={[styles.navBtn, currentPhaseIndex === 0 && styles.navBtnDisabled]} 
            onPress={() => setCurrentPhaseIndex(i => Math.max(0, i - 1))}
            disabled={currentPhaseIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentPhaseIndex === 0 ? '#334155' : '#EAB308'} />
          </TouchableOpacity>

          <View style={styles.phaseInfo}>
            <Text style={styles.phaseTitle}>{currentPhase?.name}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.navBtn, currentPhaseIndex === tournament.customPhases.length - 1 && styles.navBtnDisabled]} 
            onPress={() => setCurrentPhaseIndex(i => Math.min(tournament.customPhases.length - 1, i + 1))}
            disabled={currentPhaseIndex === tournament.customPhases.length - 1}
          >
            <Ionicons name="chevron-forward" size={20} color={currentPhaseIndex === tournament.customPhases.length - 1 ? '#334155' : '#EAB308'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Botón Finalizar Fecha (solo si hay partidos y es liga) */}
      {(() => {
        const isFinalized = tournament.matchdayWinners?.some((w: any) => 
          (w.customPhaseId === currentPhase?.id || w.phaseId === currentPhase?.id)
        );

        if (currentPhase && currentMatches.length > 0) {
          return (
            <TouchableOpacity 
              style={[styles.finalizeBtn, isFinalized && styles.finalizeBtnDisabled]} 
              onPress={handleFinalizePhase}
              disabled={loading || isFinalized}
            >
              <Ionicons 
                name={isFinalized ? "lock-closed-outline" : "ribbon-outline"} 
                size={20} 
                color={isFinalized ? "#64748B" : "#422006"} 
              />
              <Text style={[styles.finalizeBtnText, isFinalized && styles.finalizeBtnTextDisabled]}>
                {isFinalized ? 'FECHA CERRADA' : 'FINALIZAR ESTA FECHA'}
              </Text>
            </TouchableOpacity>
          );
        }
        return null;
      })()}

      {currentMatches.length === 0 && (
        <View style={styles.centered}>
          <Text style={{ color: '#64748B', marginTop: 20, fontStyle: 'italic' }}>
            {tournament.customPhases && tournament.customPhases.length > 0 ? 'No hay partidos en esta fecha' : 'No hay fechas creadas'}
          </Text>
        </View>
      )}

      {currentMatches.map((match) => (
        <TouchableOpacity key={match.id} style={styles.matchCard} onPress={() => {
          setHomeScore(match.homeScore?.toString() || '');
          setAwayScore(match.awayScore?.toString() || '');
          setShowResult(match);
        }}>
          <View style={styles.matchHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.matchDateText}>{formatDate(new Date(match.matchDate))}</Text>
              <Text style={styles.matchStatus}>{match.status === 'FINISHED' ? 'Finalizado' : 'Pendiente'}</Text>
            </View>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }} style={{ padding: 10, marginRight: -10, marginTop: -10 }}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <View style={styles.matchBody}>
            <Text style={styles.matchTeam}>{match.homeTeam?.name}</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{match.homeScore ?? '-'}</Text>
              <Text style={styles.scoreText}>:</Text>
              <Text style={styles.scoreText}>{match.awayScore ?? '-'}</Text>
            </View>
            <Text style={[styles.matchTeam, { textAlign: 'right' }]}>{match.awayTeam?.name}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nuevo Partido</Text>
              
              {tournament.format === 'liga' ? (
                <Select 
                  label="Fecha" 
                  value={`Fecha ${matchdayNumber}`} 
                  options={Array.from({ length: Math.max(parseInt(matchdayNumber), ...(tournament.customPhases?.map((p) => parseInt(p.name.replace('Fecha ', ''))) || [1])) }).map((_, i) => ({ label: `Fecha ${i + 1}`, value: (i + 1).toString() }))}
                  onSelect={(val: string) => setMatchdayNumber(val)}
                  onAdd={() => {
                    const max = Math.max(parseInt(matchdayNumber), ...(tournament.customPhases?.map((p) => parseInt(p.name.replace('Fecha ', ''))) || [0]));
                    setMatchdayNumber((max + 1).toString());
                  }}
                />
              ) : (
                <Select 
                  label="Fase" 
                  value={tournament.customPhases?.find((p) => p.id === selectedPhase)?.name || 'Seleccionar...'} 
                  options={tournament.customPhases?.map((p) => ({ label: p.name, value: p.id })) || []}
                  onSelect={(val: string) => setSelectedPhase(val)}
                />
              )}

              <Select 
                label="Equipo Local" 
                value={tournament.customTeams?.find((t) => t.id === homeTeam)?.name || 'Seleccionar...'} 
                options={tournament.customTeams?.map((t) => ({ label: t.name, value: t.id })) || []}
                onSelect={(val: string) => setHomeTeam(val)}
              />

              <Select 
                label="Equipo Visitante" 
                value={tournament.customTeams?.find((t) => t.id === awayTeam)?.name || 'Seleccionar...'} 
                options={tournament.customTeams?.map((t) => ({ label: t.name, value: t.id })) || []}
                onSelect={(val: string) => setAwayTeam(val)}
              />

              <Text style={styles.label}>Fecha y Hora del Partido</Text>
              <TouchableOpacity style={[styles.selectBox, { marginBottom: 20 }]} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.selectText}>{formatDate(matchDate)}</Text>
                <Ionicons name="calendar-outline" size={18} color="#EAB308" />
              </TouchableOpacity>

              {showDatePicker && <DateTimePicker value={matchDate} mode="date" display="default" onChange={onDateChange} />}
              {showTimePicker && <DateTimePicker value={matchDate} mode="time" display="default" onChange={onTimeChange} />}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                  <Text style={styles.modalCancelText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSubmit} onPress={handleAddMatch} disabled={loading}>
                  {loading ? <ActivityIndicator color="#422006" /> : <Text style={styles.modalSubmitText}>CREAR</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showResult} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cargar Resultado</Text>
            <View style={styles.resultRow}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.itemName}>{showResult?.homeTeam?.name}</Text>
                <TextInput style={styles.scoreInput} keyboardType="numeric" value={homeScore} onChangeText={setHomeScore} />
              </View>
              <Text style={styles.scoreText}>-</Text>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.itemName}>{showResult?.awayTeam?.name}</Text>
                <TextInput style={styles.scoreInput} keyboardType="numeric" value={awayScore} onChangeText={setAwayScore} />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowResult(null)}>
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleUpdateResult} disabled={loading}>
                <Text style={styles.modalSubmitText}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0F172A',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#0F172A', paddingBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#EAB308' },
  tabText: { color: '#64748B', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#EAB308' },
  scrollContent: { padding: 20 },
  addBtn: {
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  addBtnText: { color: '#422006', fontWeight: '900', fontSize: 14 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemInfo: { flex: 1 },
  itemName: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 16 },
  itemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#0F172A', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginBottom: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: 'bold' },
  modalSubmit: { flex: 1, backgroundColor: '#EAB308', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalSubmitText: { color: '#422006', fontWeight: '900' },
  matchCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  matchPhase: { color: '#EAB308', fontWeight: 'bold', fontSize: 12 },
  matchDateText: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  matchStatus: { color: '#64748B', fontSize: 11, textTransform: 'uppercase' },
  matchBody: { flexDirection: 'row', alignItems: 'center' },
  matchTeam: { flex: 1, color: '#F8FAFC', fontWeight: '600' },
  scoreContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 15 },
  scoreText: { color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  selectBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectText: { color: '#F8FAFC', fontSize: 15, fontWeight: '500' },
  phaseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  finalizeBtn: {
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#EAB308',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  finalizeBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  finalizeBtnTextDisabled: {
    color: '#64748B',
  },
  finalizeBtnText: {
    color: '#422006',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  dropdownModal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownHeader: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  dropdownItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemText: { color: '#94A3B8', fontSize: 16, textAlign: 'center' },
  dropdownItemTextActive: { color: '#EAB308', fontWeight: 'bold' },
  choice: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  choiceActive: { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderWidth: 1, borderColor: '#EAB308' },
  choiceText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  choiceTextActive: { color: '#EAB308' },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  scoreInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#EAB308', fontSize: 24, fontWeight: '900', textAlign: 'center', width: 60, height: 60, borderRadius: 12, marginTop: 10 },
  teamThumb: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  logoPicker: { alignSelf: 'center', marginBottom: 24, width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' },
  logoPreview: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoPickerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  addIconBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
});
