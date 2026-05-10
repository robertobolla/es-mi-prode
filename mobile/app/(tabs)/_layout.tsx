import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#EAB308',
        tabBarInactiveTintColor: '#64748B',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="tournaments" 
        options={{ 
          title: 'Torneos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="ranking" 
        options={{ 
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          )
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -5 },
    shadowRadius: 10,
    // Aumentamos el alto y el padding inferior para despegar el texto del borde
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  }
});
