import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { Ionicons } from '@expo/vector-icons';

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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
        {profile?.country && <Text style={styles.country}>📍 {profile.country}</Text>}
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

function EditProfileModal({ visible, profile, onClose, onSaved }: any) {
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setCountry(profile.country || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setGender(profile.gender || '');
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
    setSaving(true);
    try {
      await api.patch('/users/me', {
        fullName,
        country,
        bio,
        avatarUrl,
        gender,
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

            <Text style={editStyles.label}>Nombre completo</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#475569"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={editStyles.label}>País</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Argentina"
              placeholderTextColor="#475569"
              value={country}
              onChangeText={setCountry}
            />

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
    </Modal>
  );
}

function SettingsModal({ visible, profile, onClose, onSaved }: any) {
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyRanking, setNotifyRanking] = useState(true);
  const [notifyTournaments, setNotifyTournaments] = useState(true);
  const [saving, setSaving] = useState(false);

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
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron guardar los ajustes');
    } finally {
      setSaving(false);
    }
  };

  const ToggleItem = ({ label, subLabel, value, onValueChange, icon }: any) => (
    <View style={settingsStyles.item}>
      <View style={settingsStyles.itemLeft}>
        <View style={settingsStyles.iconBg}>
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

          <TouchableOpacity
            style={[settingsStyles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#422006" />
            ) : (
              <Text style={settingsStyles.saveBtnText}>GUARDAR AJUSTES</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
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
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
});

