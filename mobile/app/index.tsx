import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#EAB308', fontSize: 20 }}>Abriendo las puertas...</Text>
    </View>
  );
}
