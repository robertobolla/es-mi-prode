import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { api } from '../../lib/api';

export default function GlobalRankingScreen() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const [profileData] = await Promise.all([
        api.get('/users/me').catch(() => null),
      ]);
      setProfile(profileData);
      // For now, no global ranking endpoint exists. 
      // This will be populated once tournaments are scored.
      setRankings([]);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking Global</Text>
        <Text style={styles.subtitle}>Próximamente</Text>
      </View>

      {rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>El ranking se generará cuando{'\n'}los torneos comiencen</Text>
          <Text style={styles.emptySubtext}>Crea o únete a un torneo para empezar</Text>
        </View>
      ) : (
        <FlatList
          data={rankings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, item.userId === profile?.id && styles.highlightCard]}>
              <Text style={[styles.rank, item.rank === 1 && styles.gold]}>#{item.rank}</Text>
              <View style={styles.info}>
                <Text style={[styles.name, item.userId === profile?.id && styles.highlightText]}>{item.username}</Text>
              </View>
              <Text style={[styles.points, item.userId === profile?.id && styles.highlightText]}>{item.points} pts</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  emptyContainer: {
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
  list: {
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  highlightCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#94A3B8',
    width: 40,
  },
  gold: {
    color: '#EAB308',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  highlightText: {
    color: '#EAB308',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
});
