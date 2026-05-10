import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!username || username.trim().length < 3) {
      Alert.alert('Error', 'El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Convert dates to proper ISO if needed, but the backend accepts string/date
      await api.post('/users/onboard', { 
        username: username.trim(),
        fullName: fullName.trim() || undefined,
        country: country.trim() || undefined,
        dob: dob.trim() || undefined,
        gender: gender.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error guardando perfil. Intenta con otro nombre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Decorators */}
      <View style={styles.bgCircle1} pointerEvents="none" />
      <View style={styles.bgCircle2} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>CREA TU LEYENDA</Text>
          <Text style={styles.subtitle}>Completa tu perfil para destacarte en los torneos.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Tus Datos</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username (Ej: ProdeMaster99)"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nombre y Apellido"
              placeholderTextColor="#64748B"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="País (Ej: Argentina)"
              placeholderTextColor="#64748B"
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Fecha de nacimiento (DD/MM/YYYY)"
              placeholderTextColor="#64748B"
              value={dob}
              onChangeText={setDob}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Género (Hombre / Mujer)"
              placeholderTextColor="#64748B"
              value={gender}
              onChangeText={setGender}
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleOnboard}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#422006" />
            ) : (
              <Text style={styles.primaryBtnText}>COMENZAR LA AVENTURA</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', 
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: '#1E1B4B', 
    top: -width * 0.5,
    left: -width * 0.2,
    opacity: 0.6,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: '#0F172A', 
    bottom: -width * 0.4,
    right: -width * 0.3,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(234, 179, 8, 0.5)', 
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)', 
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#EAB308', 
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#EAB308',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#422006', 
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
