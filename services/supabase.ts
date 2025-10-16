
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://unobsdcppmnsqjjnsrue.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVub2JzZGNwcG1uc3Fqam5zcnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjA2NDYsImV4cCI6MjA3NjEzNjY0Nn0.D3qL6aKQSp2QvJHlKkYh6HPLFUXzLoU1bjUKl7BDe9g';

/**
 * Supabase Client Configuration
 * Configured for cross-platform support (iOS, Android, Web)
 * with persistent sessions and auto-refresh tokens
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-platform': Platform.OS,
    },
  },
});

console.log('✅ Supabase client initialized for platform:', Platform.OS);
