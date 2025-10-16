
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { supabase } from '@/services/supabase';

export default function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('categories').select('id').limit(1);
        setIsOnline(!error);
        if (!error) {
          setLastSync(new Date());
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: isOnline ? '#34C759' : '#FF3B30' }]}>
        <IconSymbol 
          name={isOnline ? 'checkmark.circle.fill' : 'xmark.circle.fill'} 
          size={12} 
          color="white" 
        />
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {isOnline ? 'Synced' : 'Offline'}
        {lastSync && isOnline && ` • ${lastSync.toLocaleTimeString()}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
