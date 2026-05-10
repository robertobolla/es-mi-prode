import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ulpvmjfdlnlkhsvnnqoe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscHZtamZkbG5sa2hzdm5ucW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTc3MzksImV4cCI6MjA4OTY5MzczOX0.wiOnoeBH2zwszLkvzr90tD8NaIRIS97FVK7976nfP4w'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
