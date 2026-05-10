import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Estas constantes deberían ir en una variable de entorno idealmente
const supabaseUrl = 'https://ulpvmjfdlnlkhsvnnqoe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscHZtamZkbG5sa2hzdm5ucW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTc3MzksImV4cCI6MjA4OTY5MzczOX0.wiOnoeBH2zwszLkvzr90tD8NaIRIS97FVK7976nfP4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStore as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
