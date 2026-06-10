import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, ScrollView, Platform, Dimensions, 
  Alert, ActivityIndicator, Modal, FlatList 
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { STATES_BY_COUNTRY } from '../../lib/states';

const { width, height } = Dimensions.get('window');

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

const GENDERS = [
  { id: 'Hombre', icon: 'male', label: 'Hombre' },
  { id: 'Mujer', icon: 'female', label: 'Mujer' },
  { id: 'Otro', icon: 'help-circle', label: 'Otro' },
];

interface TutorialSlide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradientColors: [string, string];
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    icon: 'globe-outline',
    title: 'EL RANKING MUNDIAL',
    description: 'Todos los usuarios participan automáticamente del Torneo Público Oficial de la Copa y compiten en el Ranking Mundial. ¡Demostrá que sos el verdadero máster!',
    gradientColors: ['#EAB308', '#CA8A04'],
  },
  {
    icon: 'football-outline',
    title: 'CÓMO PREDECIR',
    description: 'Ingresá a tu torneo, tocá el botón "Predecir" y completá tus marcadores en la pantalla de partidos. ¡Tus pronósticos se guardan automáticamente al salir del casillero!',
    gradientColors: ['#3B82F6', '#1D4ED8'],
  },
  {
    icon: 'star-outline',
    title: 'PUNTOS ESPECIALES',
    description: 'Arriesgá quiénes pasarán de grupo, y elegí al Goleador, el MVP y el mejor Arquero de la Copa para ganar valiosos puntos bonus antes de que comience el torneo.',
    gradientColors: ['#F97316', '#C2410C'],
  },
  {
    icon: 'people-outline',
    title: 'JUGÁ CON AMIGOS',
    description: '¿Querés tu propio prode con reglas personalizadas? Creá torneos privados premium para competir cara a cara con tus amigos. No son gratuitos, pero la rivalidad vale la pena.',
    gradientColors: ['#10B981', '#047857'],
  },
];

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [gender, setGender] = useState('Hombre');
  const [loading, setLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

  useEffect(() => {
    const available = STATES_BY_COUNTRY[country.name];
    if (available && available.length > 0) {
      setStateName(available[0]);
    } else {
      setStateName('');
    }
  }, [country]);

  // Simple Date State
  const [day, setDay] = useState('01');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState('2000');

  // Tutorial States
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Pre-populate name from Supabase Auth metadata
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const meta = data?.session?.user?.user_metadata;
      if (!meta) return;

      const firstName = (meta.first_name as string | undefined) ?? '';
      const lastName = (meta.last_name as string | undefined) ?? '';

      if (firstName || lastName) {
        // Nuevo formato: first_name y last_name guardados por separado
        setFirstName(firstName);
        setLastName(lastName);
      } else if (meta.full_name) {
        // Fallback: cuentas antiguas que solo tienen full_name
        const parts = (meta.full_name as string).trim().split(' ');
        setFirstName(parts[0] ?? '');
        setLastName(parts.slice(1).join(' '));
      }
    });
  }, []);

  const handleOnboard = async () => {
    if (!username || username.trim().length < 3) {
      Alert.alert('Error', 'El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();
      await api.post('/users/onboard', { 
        username: username.trim(),
        fullName: fullNameCombined || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setShowTutorial(true);
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message || 'Error guardando perfil. Intenta con otro nombre.');
    } finally {
      setLoading(false);
    }
  };

  if (showTutorial) {
    const slide = TUTORIAL_SLIDES[currentSlide];
    
    const handleNext = () => {
      if (currentSlide < TUTORIAL_SLIDES.length - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setCurrentSlide(currentSlide + 1);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/(tabs)');
      }
    };

    const handleSkip = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.replace('/(tabs)');
    };

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#020617', '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={tutorialStyles.header}>
          <TouchableOpacity style={tutorialStyles.skipBtn} onPress={handleSkip}>
            <Text style={tutorialStyles.skipText}>Omitir</Text>
          </TouchableOpacity>
        </View>

        <View style={tutorialStyles.content}>
          {/* Progress Indicator */}
          <View style={tutorialStyles.progressContainer}>
            {TUTORIAL_SLIDES.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  tutorialStyles.progressDot, 
                  idx === currentSlide && tutorialStyles.progressDotActive
                ]} 
              />
            ))}
          </View>

          {/* Glowing Icon Badge */}
          <LinearGradient
            colors={slide.gradientColors}
            style={tutorialStyles.iconBadge}
          >
            <Ionicons name={slide.icon} size={44} color="#F8FAFC" />
          </LinearGradient>

          {/* Slide Text */}
          <Text style={tutorialStyles.slideTitle}>{slide.title}</Text>
          <Text style={tutorialStyles.slideDescription}>{slide.description}</Text>
        </View>

        {/* Footer Button */}
        <View style={tutorialStyles.footer}>
          <TouchableOpacity style={tutorialStyles.actionBtn} onPress={handleNext}>
            <LinearGradient
              colors={slide.gradientColors}
              style={tutorialStyles.actionGradient}
            >
              <Text style={tutorialStyles.actionText}>
                {currentSlide === TUTORIAL_SLIDES.length - 1 ? '¡COMENZAR LA AVENTURA!' : 'SIGUIENTE'}
              </Text>
              <Ionicons 
                name={currentSlide === TUTORIAL_SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'} 
                size={20} 
                color="#F8FAFC" 
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      <TouchableOpacity 
        style={styles.signOutBtn}
        onPress={() => {
          Alert.alert('Cerrar sesión', '¿Estás seguro que deseas salir con esta cuenta?', [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Salir', 
              style: 'destructive', 
              onPress: async () => {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              }
            }
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="#94A3B8" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              style={styles.logoBadge}
            >
              <Ionicons name="trophy" size={32} color="#422006" />
            </LinearGradient>
            <Text style={styles.title}>CREA TU LEYENDA</Text>
            <Text style={styles.subtitle}>Personaliza tu perfil para que todos sepan quién es el jefe.</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>IDENTIDAD</Text>
            <TextInput
              style={styles.mainInput}
              placeholder="Username (Ej: ProdeMaster99)"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
            />
            <TextInput
              style={styles.mainInput}
              placeholder="Nombre"
              placeholderTextColor="#64748B"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.mainInput}
              placeholder="Apellido"
              placeholderTextColor="#64748B"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleOnboard}
            disabled={loading}
          >
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#422006" />
              ) : (
                <>
                  <Text style={styles.submitText}>COMENZAR LA AVENTURA</Text>
                  <Ionicons name="arrow-forward" size={20} color="#422006" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu país</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  {country.id === item.id && (
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona tu Provincia / Estado</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATES_BY_COUNTRY[country.name] || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.countryItem}
                  onPress={() => {
                    setStateName(item);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={styles.countryItemName}>{item}</Text>
                  {stateName === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#EAB308" />
                  )}
                </TouchableOpacity>
              )}
            />
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
  signOutBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 10,
    shadowColor: '#EAB308',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#EAB308',
    marginBottom: 12,
    letterSpacing: 2,
    opacity: 0.8,
  },
  mainInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 18,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  genderCardActive: {
    borderColor: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  genderLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  genderLabelActive: {
    color: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countrySelector: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryName: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  dobContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dobInput: {
    width: 25,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 0,
  },
  dobSlash: {
    color: '#64748B',
    marginHorizontal: 2,
    fontWeight: 'bold',
  },
  submitBtn: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#EAB308',
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  submitText: {
    color: '#422006',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
});

const tutorialStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'flex-end',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#EAB308',
    width: 20,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 2,
  },
  slideDescription: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 50,
  },
  actionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
