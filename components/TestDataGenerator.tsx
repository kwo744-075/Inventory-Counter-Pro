
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
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useInventory } from '@/contexts/InventoryContext';
import { InventoryCategory, ItemNumberEntry } from '@/types/inventory';

export default function TestDataGenerator() {
  const { addItemNumber, getAllItemNumbers, forceRefresh } = useInventory();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateSampleData = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🔄 Generating sample test data...');
      
      const sampleData: Omit<ItemNumberEntry, 'id'>[] = [
        // Oils
        {
          itemNumber: 'OIL-001',
          productName: '5W-30 Synthetic Motor Oil',
          floorCount: 5,
          storageCount: 12,
          totalCount: 17,
          category: 'oils' as InventoryCategory,
        },
        {
          itemNumber: 'OIL-002',
          productName: '10W-40 Conventional Oil',
          floorCount: 3,
          storageCount: 8,
          totalCount: 11,
          category: 'oils' as InventoryCategory,
        },
        {
          itemNumber: 'OIL-003',
          productName: '0W-20 Full Synthetic',
          floorCount: 7,
          storageCount: 15,
          totalCount: 22,
          category: 'oils' as InventoryCategory,
        },
        
        // Oil Filters
        {
          itemNumber: 'OF-001',
          productName: 'K&N Oil Filter',
          floorCount: 2,
          storageCount: 15,
          totalCount: 17,
          category: 'oil-filters' as InventoryCategory,
        },
        {
          itemNumber: 'OF-002',
          productName: 'Fram Extra Guard Oil Filter',
          floorCount: 4,
          storageCount: 20,
          totalCount: 24,
          category: 'oil-filters' as InventoryCategory,
        },
        
        // Air Filters
        {
          itemNumber: 'AF-001',
          productName: 'Engine Air Filter - Honda',
          floorCount: 1,
          storageCount: 6,
          totalCount: 7,
          category: 'air-filters' as InventoryCategory,
        },
        {
          itemNumber: 'AF-002',
          productName: 'K&N High-Flow Air Filter',
          floorCount: 3,
          storageCount: 10,
          totalCount: 13,
          category: 'air-filters' as InventoryCategory,
        },
        
        // Cabin Filters
        {
          itemNumber: 'CF-001',
          productName: 'Cabin Air Filter - Toyota',
          floorCount: 2,
          storageCount: 8,
          totalCount: 10,
          category: 'cabin-filters' as InventoryCategory,
        },
        {
          itemNumber: 'CF-002',
          productName: 'HEPA Cabin Filter',
          floorCount: 1,
          storageCount: 5,
          totalCount: 6,
          category: 'cabin-filters' as InventoryCategory,
        },
        
        // Wipers
        {
          itemNumber: 'WP-001',
          productName: '22-inch Wiper Blades',
          floorCount: 4,
          storageCount: 12,
          totalCount: 16,
          category: 'wipers' as InventoryCategory,
        },
        {
          itemNumber: 'WP-002',
          productName: 'Rain-X Latitude Wipers',
          floorCount: 6,
          storageCount: 18,
          totalCount: 24,
          category: 'wipers' as InventoryCategory,
        },
        
        // Miscellaneous
        {
          itemNumber: 'MISC-001',
          productName: 'Brake Fluid DOT 3',
          floorCount: 2,
          storageCount: 10,
          totalCount: 12,
          category: 'misc' as InventoryCategory,
        },
        {
          itemNumber: 'MISC-002',
          productName: 'Coolant - Universal',
          floorCount: 3,
          storageCount: 15,
          totalCount: 18,
          category: 'misc' as InventoryCategory,
        },
      ];
      
      // Add each sample item
      for (const item of sampleData) {
        addItemNumber(item);
        console.log(`✅ Added sample item: ${item.itemNumber}`);
      }
      
      // Force refresh to update UI
      forceRefresh();
      
      console.log(`✅ Generated ${sampleData.length} sample items`);
      
      Alert.alert(
        'Sample Data Generated',
        `Successfully added ${sampleData.length} sample inventory items across all categories. You can now test the reset functions.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error generating sample data:', error);
      Alert.alert(
        'Error',
        `Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const currentItemCount = getAllItemNumbers().length;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Test Data Generator
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Generate sample inventory data to test reset functions
      </Text>

      <GlassView style={styles.infoCard} glassEffectStyle="regular">
        <View style={styles.infoHeader}>
          <IconSymbol name="info.circle.fill" color={colors.primary} size={20} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Current Status
          </Text>
        </View>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          You currently have {currentItemCount} item numbers in your inventory.
        </Text>
        {currentItemCount === 0 && (
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            Generate sample data to test the reset functions effectively.
          </Text>
        )}
      </GlassView>

      <Pressable
        style={[
          styles.generateButton,
          { backgroundColor: colors.secondary },
          isGenerating && styles.disabledButton
        ]}
        onPress={generateSampleData}
        disabled={isGenerating}
      >
        <View style={styles.generateButtonContent}>
          {isGenerating ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="plus.circle.fill" color="white" size={20} />
              <Text style={styles.generateButtonText}>
                Generate Sample Data
              </Text>
            </>
          )}
        </View>
      </Pressable>

      <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.detailsTitle, { color: colors.text }]}>
          What will be generated:
        </Text>
        <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
          • 14 sample inventory items{'\n'}
          • Distributed across all 6 categories{'\n'}
          • Various floor and storage counts{'\n'}
          • Realistic product names and item numbers
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  generateButton: {
    borderRadius: 12,
    padding: 16,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
