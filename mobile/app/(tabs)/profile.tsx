import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { Ionicons } from '@expo/vector-icons';
import { STATES_BY_COUNTRY } from '../../lib/states';

const COUNTRIES = [
  { id: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { id: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'CL', name: 'Chile', flag: '🇨🇱' },
  { id: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { id: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { id: 'MX', name: 'México', flag: '🇲🇽' },
  { id: 'ES', name: 'España', flag: '🇪🇸' },
  { id: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { id: 'OTHER', name: 'Otro', flag: '🌎' },
];

// Gravatar URL from email (MD5 hash)
function getGravatarUrl(email: string, size = 200) {
  // Simple hash for gravatar - works without crypto lib
  const hash = email?.trim().toLowerCase() || '';
  return `https://www.gravatar.com/avatar/${simpleHash(hash)}?s=${size}&d=identicon`;
}

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function formatDob(dobString: string | null) {
  if (!dobString) return '';
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}


export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const data = await api.get('/users/me');
      setProfile(data);
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

  const avatarSource = profile?.avatarUrl
    ? { uri: profile.avatarUrl }
    : { uri: getGravatarUrl(profile?.email || '') };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={24} color="#94A3B8" />
        </TouchableOpacity>

        <Image source={avatarSource} style={styles.avatar} />
        <Text style={styles.name}>{profile?.fullName || profile?.username || 'Jugador'}</Text>
        <Text style={styles.username}>@{profile?.username}</Text>
        <Text style={styles.emailText}>📧 {profile?.email}</Text>
        {(profile?.city || profile?.state || profile?.country) && (
          <Text style={styles.country}>
            📍 {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
          </Text>
        )}
        {profile?.dob && (
          <Text style={styles.dobText}>
            📅 Nacimiento: {formatDob(profile.dob)}
          </Text>
        )}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
          <Text style={styles.editBtnText}>EDITAR PERFIL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.tournamentsPlayed || 0}</Text>
          <Text style={styles.statLabel}>Torneos</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.tournamentsWon || 0}</Text>
          <Text style={styles.statLabel}>Ganados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.exactResults || 0}</Text>
          <Text style={styles.statLabel}>Exactos</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tus Medallas</Text>
        <View style={styles.badgesList}>
          {profile?.badges?.length > 0 ? (
            profile.badges.map((b: any, index: number) => (
              <View key={index} style={styles.badgeCard}>
                <View style={styles.badgeIconBg}>
                  <Text style={styles.badgeEmoji}>
                    {b.badgeType === 'CHAMPION' ? '🏆' : b.badgeType === 'RUNNER_UP' ? '🥈' : '🥉'}
                  </Text>
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={styles.badgeTitle}>
                    {b.badgeType === 'CHAMPION' ? 'Campeón' : b.badgeType === 'RUNNER_UP' ? 'Subcampeón' : '3er Puesto'}
                  </Text>
                  <Text style={styles.badgeTournament} numberOfLines={1}>{b.tournament?.name || 'Torneo'}</Text>
                </View>
                <Text style={styles.badgeDate}>
                  {new Date(b.earnedAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aún no tienes medallas</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Torneos</Text>
        <View style={styles.historyList}>
          {profile?.memberships?.length > 0 ? (
            profile.memberships.map((m: any, index: number) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTournamentName} numberOfLines={1}>{m.tournament?.name || 'Torneo'}</Text>
                  <Text style={styles.historyCompetition}>{m.tournament?.competition?.name || 'Competición Global'}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View style={styles.historyStatBox}>
                    <Text style={styles.historyStatValue}>#{m.rank || '-'}</Text>
                    <Text style={styles.historyStatLabel}>Posición</Text>
                  </View>
                  <View style={styles.historyStatBox}>
                    <Text style={styles.historyStatValue}>{m.totalPoints}</Text>
                    <Text style={styles.historyStatLabel}>Pts</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No jugaste ningún torneo todavía.</Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={async () => {
          await supabase.auth.signOut();
          queryClient.clear();
          setProfile(null);
          router.replace('/(auth)/login');
        }}
      >
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={showEdit}
        profile={profile}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          setShowEdit(false);
          fetchProfile();
        }}
      />

      <SettingsModal
        visible={showSettings}
        profile={profile}
        onClose={() => setShowSettings(false)}
        onSaved={() => {
          setShowSettings(false);
          fetchProfile();
        }}
      />
    </ScrollView>
  );
}

interface EditProfileModalProps {
  visible: boolean;
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    country: string | null;
    city: string | null;
    state: string | null;
    bio: string | null;
    avatarUrl: string | null;
    gender: string | null;
    dob: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditProfileModal({ visible, profile, onClose, onSaved }: EditProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('01');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState('2000');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Only run this when country changes after modal is visible to reset stateName if invalid
    if (!visible) return;
    const available = STATES_BY_COUNTRY[country];
    if (available && !available.includes(stateName)) {
      setStateName(available[0] || '');
    }
  }, [country]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setCountry(profile.country || '');
      setCity(profile.city || '');
      setStateName(profile.state || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setGender(profile.gender || '');
      
      if (profile.dob) {
        const date = new Date(profile.dob);
        if (!isNaN(date.getTime())) {
          setDay(date.getDate().toString().padStart(2, '0'));
          setMonth((date.getMonth() + 1).toString().padStart(2, '0'));
          setYear(date.getFullYear().toString());
        }
      } else {
        setDay('');
        setMonth('');
        setYear('');
      }
    }
  }, [profile, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      handleUpload(result.assets[0]);
    }
  };

  const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!profile) {
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
      return;
    }
    setUploading(true);
    try {
      const fileName = `${profile.id}/${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64!), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      Alert.alert('Éxito', 'Imagen cargada correctamente');
    } catch (e: any) {
      console.error('Upload error:', e);
      Alert.alert('Error', 'No se pudo subir la imagen. Asegurate de tener el bucket "avatars" creado en Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    let dobString: string | null = null;

    if (day.trim() || month.trim() || year.trim()) {
      const dVal = parseInt(day, 10);
      const mVal = parseInt(month, 10);
      const yVal = parseInt(year, 10);

      if (isNaN(dVal) || isNaN(mVal) || isNaN(yVal)) {
        Alert.alert('Error', 'Por favor ingresá una fecha de nacimiento válida o dejala vacía.');
        return;
      }

      if (dVal < 1 || dVal > 31 || mVal < 1 || mVal > 12 || yVal < 1900 || yVal > new Date().getFullYear()) {
        Alert.alert('Error', 'Por favor ingresá una fecha de nacimiento válida.');
        return;
      }

      const paddedDay = day.trim().padStart(2, '0');
      const paddedMonth = month.trim().padStart(2, '0');
      const paddedYear = year.trim();
      dobString = `${paddedYear}-${paddedMonth}-${paddedDay}`;
      const parsedDate = new Date(dobString);

      if (isNaN(parsedDate.getTime())) {
        Alert.alert('Error', 'Por favor ingresá una fecha de nacimiento válida.');
        return;
      }
    }

    setSaving(true);
    try {
      await api.patch('/users/me', {
        fullName,
        country: country || null,
        city: city || null,
        state: stateName || null,
        bio,
        avatarUrl,
        gender: gender || null,
        dob: dobString,
      });
      Alert.alert('¡Listo!', 'Tu perfil fue actualizado');
      onSaved();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={editStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={editStyles.container}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={editStyles.headerRow}>
              <Text style={editStyles.title}>Editar Perfil</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={editStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={editStyles.label}>Foto de perfil</Text>
            <View style={editStyles.avatarEditRow}>
              <Image 
                source={avatarUrl ? { uri: avatarUrl } : { uri: getGravatarUrl(profile?.email || '') }} 
                style={editStyles.avatarPreview} 
              />
              <TouchableOpacity 
                style={[editStyles.galleryBtn, uploading && { opacity: 0.6 }]} 
                onPress={pickImage}
                disabled={uploading}
              >
                <Text style={editStyles.galleryBtnText}>
                  {uploading ? 'SUBIENDO...' : 'CAMBIAR FOTO'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={editStyles.label}>Correo electrónico (no modificable)</Text>
            <TextInput
              style={[editStyles.input, { opacity: 0.6 }]}
              value={profile?.email || ''}
              editable={false}
            />

            <Text style={editStyles.label}>Nombre completo</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#475569"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={editStyles.label}>País</Text>
            <TouchableOpacity 
              style={[editStyles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={{ color: country ? '#F8FAFC' : '#475569', fontSize: 15 }}>
                {country || 'Selecciona un país'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <Text style={editStyles.label}>Provincia / Estado</Text>
            {STATES_BY_COUNTRY[country] ? (
              <TouchableOpacity 
                style={[editStyles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setShowStateModal(true)}
              >
                <Text style={{ color: stateName ? '#F8FAFC' : '#475569', fontSize: 15 }}>
                  {stateName || 'Selecciona Provincia / Estado'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : (
              <TextInput
                style={editStyles.input}
                placeholder="Provincia / Estado (Opcional)"
                placeholderTextColor="#475569"
                value={stateName}
                onChangeText={setStateName}
              />
            )}

            <Text style={editStyles.label}>Ciudad</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Buenos Aires"
              placeholderTextColor="#475569"
              value={city}
              onChangeText={setCity}
            />

            <Text style={editStyles.label}>Fecha de nacimiento</Text>
            <View style={editStyles.dobContainer}>
              <TextInput
                style={editStyles.dobInput}
                placeholder="DD"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                maxLength={2}
                value={day}
                onChangeText={setDay}
              />
              <Text style={editStyles.dobSlash}>/</Text>
              <TextInput
                style={editStyles.dobInput}
                placeholder="MM"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                maxLength={2}
                value={month}
                onChangeText={setMonth}
              />
              <Text style={editStyles.dobSlash}>/</Text>
              <TextInput
                style={[editStyles.dobInput, { width: 50 }]}
                placeholder="YYYY"
                placeholderTextColor="#475569"
                keyboardType="numeric"
                maxLength={4}
                value={year}
                onChangeText={setYear}
              />
            </View>

            <Text style={editStyles.label}>Género</Text>
            <View style={editStyles.genderRow}>
              {['Masculino', 'Femenino', 'Otro'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[editStyles.genderChip, gender === g && editStyles.genderActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[editStyles.genderText, gender === g && editStyles.genderTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={editStyles.label}>Bio</Text>
            <TextInput
              style={[editStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Contá algo sobre vos..."
              placeholderTextColor="#475569"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
            />

            <TouchableOpacity
              style={[editStyles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#422006" />
              ) : (
                <Text style={editStyles.saveBtnText}>GUARDAR</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={editStyles.overlay}>
          <View style={editStyles.container}>
            <View style={editStyles.headerRow}>
              <Text style={editStyles.title}>Selecciona tu país</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Text style={editStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: typeof COUNTRIES[number] }) => (
                <TouchableOpacity 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  }}
                  onPress={() => {
                    setCountry(item.name);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 16 }}>{item.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 16, color: '#F8FAFC', fontWeight: '500' }}>{item.name}</Text>
                  {country === item.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#EAB308" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={editStyles.overlay}>
          <View style={editStyles.container}>
            <View style={editStyles.headerRow}>
              <Text style={editStyles.title}>Selecciona tu Provincia / Estado</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Text style={editStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATES_BY_COUNTRY[country] || []}
              keyExtractor={(item) => item}
              renderItem={({ item }: { item: string }) => (
                <TouchableOpacity 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  }}
                  onPress={() => {
                    setStateName(item);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 16, color: '#F8FAFC', fontWeight: '500' }}>{item}</Text>
                  {stateName === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#EAB308" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

interface SettingsModalProps {
  visible: boolean;
  profile: {
    email?: string;
    notifyMatches?: boolean;
    notifyRanking?: boolean;
    notifyTournaments?: boolean;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

function SettingsModal({ visible, profile, onClose, onSaved }: SettingsModalProps) {
  const queryClient = useQueryClient();
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyRanking, setNotifyRanking] = useState(true);
  const [notifyTournaments, setNotifyTournaments] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change states
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y borrará todos tus datos, torneos y predicciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar permanentemente',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar Eliminación',
              'Esta es la última advertencia. Se borrará toda tu información de forma permanente. ¿Deseas continuar?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, eliminar',
                  style: 'destructive',
                  onPress: executeDeleteAccount,
                }
              ]
            );
          }
        }
      ]
    );
  };

  const executeDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/me');
      Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada correctamente.');
      onClose();
      await supabase.auth.signOut();
      queryClient.clear();
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo eliminar la cuenta. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setNotifyMatches(profile.notifyMatches ?? true);
      setNotifyRanking(profile.notifyRanking ?? true);
      setNotifyTournaments(profile.notifyTournaments ?? true);
    }
  }, [profile, visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        notifyMatches,
        notifyRanking,
        notifyTournaments,
      });
      onSaved();
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', err.message || 'No se pudieron guardar los ajustes');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Ingresá tu contraseña actual.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Ingresá una nueva contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Error', 'La nueva contraseña no puede ser igual a la contraseña actual.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const email = profile?.email;
      if (!email) {
        throw new Error('No se pudo verificar el correo electrónico del perfil.');
      }

      // 1. Re-authenticate user to verify current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (authError) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      // 2. Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      Alert.alert('¡Éxito!', 'Tu contraseña fue actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
    } catch (e) {
      const err = e as Error;
      Alert.alert('Error', err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const ToggleItem = ({ label, subLabel, value, onValueChange, icon }: {
    label: string;
    subLabel: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
    icon: string;
  }) => (
    <View style={settingsStyles.item}>
      <View style={settingsStyles.itemLeft}>
        <View style={settingsStyles.iconBg}>
          {/* @ts-ignore */}
          <Ionicons name={icon} size={20} color="#EAB308" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={settingsStyles.itemLabel}>{label}</Text>
          <Text style={settingsStyles.itemSubLabel}>{subLabel}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[settingsStyles.switch, value && settingsStyles.switchActive]} 
        onPress={() => onValueChange(!value)}
      >
        <View style={[settingsStyles.switchThumb, value && settingsStyles.switchThumbActive]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={settingsStyles.overlay}>
        <View style={settingsStyles.container}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={settingsStyles.headerRow}>
              <Text style={settingsStyles.title}>Ajustes</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={settingsStyles.sectionTitle}>Notificaciones</Text>
            
            <ToggleItem
              icon="football-outline"
              label="Recordatorios de Partidos"
              subLabel="Recibí alertas antes de que empiecen tus partidos"
              value={notifyMatches}
              onValueChange={setNotifyMatches}
            />

            <ToggleItem
              icon="stats-chart-outline"
              label="Cambios en el Ranking"
              subLabel="Enterate cuando alguien te pasa o cambia tu posición"
              value={notifyRanking}
              onValueChange={setNotifyRanking}
            />

            <ToggleItem
              icon="trophy-outline"
              label="Nuevos Torneos"
              subLabel="Avisame cuando se crean torneos oficiales"
              value={notifyTournaments}
              onValueChange={setNotifyTournaments}
            />

            {/* PASSWORD SECURITY SECTION */}
            <Text style={[settingsStyles.sectionTitle, { marginTop: 16 }]}>Seguridad</Text>
            
            {!showPasswordFields ? (
              <TouchableOpacity 
                style={settingsStyles.changePasswordBtn}
                onPress={() => setShowPasswordFields(true)}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#EAB308" />
                <Text style={settingsStyles.changePasswordBtnText}>CAMBIAR CONTRASEÑA</Text>
              </TouchableOpacity>
            ) : (
              <View style={settingsStyles.passwordContainer}>
                <TextInput
                  style={settingsStyles.passwordInput}
                  placeholder="Contraseña actual"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={settingsStyles.passwordInput}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={settingsStyles.passwordInput}
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <View style={settingsStyles.passwordActionsRow}>
                  <TouchableOpacity 
                    style={settingsStyles.cancelPasswordBtn}
                    onPress={() => {
                      setShowPasswordFields(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={updatingPassword}
                  >
                    <Text style={settingsStyles.cancelPasswordBtnText}>CANCELAR</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[settingsStyles.confirmPasswordBtn, updatingPassword && { opacity: 0.6 }]}
                    onPress={handleUpdatePassword}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? (
                      <ActivityIndicator size="small" color="#422006" />
                    ) : (
                      <Text style={settingsStyles.confirmPasswordBtnText}>ACTUALIZAR</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Danger Zone */}
            <Text style={[settingsStyles.sectionTitle, { marginTop: 24, color: '#EF4444' }]}>Zona de Peligro</Text>
            <View style={settingsStyles.dangerZone}>
              <Text style={settingsStyles.dangerZoneText}>
                Si eliminás tu cuenta, se borrarán todos tus datos personales, predicciones e historial de forma definitiva.
              </Text>
              <TouchableOpacity
                style={[settingsStyles.deleteBtn, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#F8FAFC" />
                ) : (
                  <Text style={settingsStyles.deleteBtnText}>ELIMINAR MI CUENTA PERMANENTEMENTE</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[settingsStyles.saveBtn, saving && { opacity: 0.6 }, { marginTop: 32 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#422006" />
              ) : (
                <Text style={settingsStyles.saveBtnText}>GUARDAR AJUSTES</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
    backgroundColor: '#020617',
  },
  settingsIcon: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#EAB308',
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  username: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  country: {
    color: '#94A3B8',
    marginTop: 8,
  },
  emailText: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  dobText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  editBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  editBtnText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    marginHorizontal: 24,
    marginTop: -20,
    borderRadius: 16,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    padding: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  badgesList: {
    gap: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badgeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  badgeTournament: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  badgeDate: {
    fontSize: 12,
    color: '#64748B',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  historyLeft: {
    flex: 1,
    paddingRight: 12,
  },
  historyTournamentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  historyCompetition: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  historyRight: {
    flexDirection: 'row',
    gap: 12,
  },
  historyStatBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 54,
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  historyStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  logoutBtn: {
    margin: 24,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const editStyles = StyleSheet.create({
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 24,
    padding: 8,
  },
  avatarEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  avatarPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#EAB308',
    backgroundColor: '#1E293B',
  },
  galleryBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  galleryBtnText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 15,
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: 150,
  },
  dobInput: {
    width: 30,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 0,
  },
  dobSlash: {
    color: '#475569',
    marginHorizontal: 4,
    fontWeight: 'bold',
  },
  hint: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  genderActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  genderText: {
    color: '#64748B',
    fontSize: 13,
  },
  genderTextActive: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#EAB308',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: '#422006',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

const settingsStyles = StyleSheet.create({
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  itemSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    padding: 3,
  },
  switchActive: {
    backgroundColor: '#EAB308',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#94A3B8',
  },
  switchThumbActive: {
    backgroundColor: '#422006',
    transform: [{ translateX: 22 }],
  },
  saveBtn: {
    backgroundColor: '#EAB308',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#EAB308',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnText: {
    color: '#422006',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  changePasswordBtnText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  passwordContainer: {
    gap: 12,
    marginTop: 8,
  },
  passwordInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 15,
  },
  passwordActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelPasswordBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelPasswordBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmPasswordBtn: {
    flex: 1,
    backgroundColor: '#EAB308',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPasswordBtnText: {
    color: '#422006',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dangerZone: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  dangerZoneText: {
    color: '#FDA4AF',
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

