
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useInventory } from '@/contexts/InventoryContext';

interface ResetControlsProps {
  onResetComplete?: () => void;
}

export default function ResetControls({ onResetComplete }: ResetControlsProps) {
  const { resetFloorCounts, resetStorageCounts, resetItemNumbers, forceRefresh } = useInventory();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetFloorCounts = () => {
    Alert.alert(
      '⚠️ Reset Floor Counts',
      'This will set all floor counts to 0. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              console.log('🔄 Resetting floor counts...');
              
              await resetFloorCounts();
              
              // Refresh local state
              forceRefresh();
              setTimeout(() => forceRefresh(), 300);
              
              Alert.alert('✅ Success', 'All floor counts have been reset to 0');
              onResetComplete?.();
            } catch (error) {
              console.error('❌ Error resetting floor counts:', error);
              Alert.alert(
                '❌ Error',
                `Failed to reset floor counts: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleResetStorageCounts = () => {
    Alert.alert(
      '⚠️ Reset Storage Counts',
      'This will set all storage counts to 0. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              console.log('🔄 Resetting storage counts...');
              
              await resetStorageCounts();
              
              // Refresh local state
              forceRefresh();
              setTimeout(() => forceRefresh(), 300);
              
              Alert.alert('✅ Success', 'All storage counts have been reset to 0');
              onResetComplete?.();
            } catch (error) {
              console.error('❌ Error resetting storage counts:', error);
              Alert.alert(
                '❌ Error',
                `Failed to reset storage counts: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleResetItemNumbers = () => {
    Alert.alert(
      '⚠️ Delete All Items',
      'This will permanently delete ALL item numbers. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResetting(true);
              console.log('🗑️ Deleting all item numbers...');
              
              await resetItemNumbers();
              
              // Refresh local state
              forceRefresh();
              setTimeout(() => forceRefresh(), 300);
              
              Alert.alert('✅ Success', 'All item numbers have been deleted');
              onResetComplete?.();
            } catch (error) {
              console.error('❌ Error deleting item numbers:', error);
              Alert.alert(
                '❌ Error',
                `Failed to delete item numbers: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Reset Controls
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        All operations sync with local storage
      </Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.resetButtonPressable}
          onPress={handleResetFloorCounts}
          disabled={isResetting}
        >
          <GlassView
            style={[styles.resetButton, { backgroundColor: colors.accent }]}
            glassEffectStyle="regular"
          >
            {isResetting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <IconSymbol name="arrow.counterclockwise" size={18} color="white" />
            )}
            <Text style={styles.resetButtonText}>Reset Floor Counts</Text>
          </GlassView>
        </Pressable>

        <Pressable
          style={styles.resetButtonPressable}
          onPress={handleResetStorageCounts}
          disabled={isResetting}
        >
          <GlassView
            style={[styles.resetButton, { backgroundColor: colors.accent }]}
            glassEffectStyle="regular"
          >
            {isResetting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <IconSymbol name="arrow.counterclockwise" size={18} color="white" />
            )}
            <Text style={styles.resetButtonText}>Reset Storage Counts</Text>
          </GlassView>
        </Pressable>

        <Pressable
          style={styles.resetButtonPressable}
          onPress={handleResetItemNumbers}
          disabled={isResetting}
        >
          <GlassView
            style={[styles.resetButton, { backgroundColor: '#FF3B30' }]}
            glassEffectStyle="regular"
          >
            {isResetting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <IconSymbol name="trash.fill" size={18} color="white" />
            )}
            <Text style={styles.resetButtonText}>Delete All Items</Text>
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  buttonsContainer: {
    gap: 10,
  },
  resetButtonPressable: {
    width: '100%',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
