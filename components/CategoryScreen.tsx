
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  TextInput, 
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { colors } from '@/styles/commonStyles';
import { InventoryCategory, ItemNumberEntry } from '@/types/inventory';
import { IconSymbol } from '@/components/IconSymbol';
import { useInventory } from '@/contexts/InventoryContext';
import { exportCategoryToExcel } from '@/utils/excelExport';
import { 
  upsertItemNumber, 
  deleteItemNumber as deleteItemNumberFromSupabase,
  fetchItemNumbersByCategory 
} from '@/services/supabaseHelpers';

interface CategoryScreenProps {
  category: InventoryCategory;
  title: string;
  icon: string;
  placeholderExample: string;
}

export default function CategoryScreen({
  category,
  title,
  icon,
  placeholderExample,
}: CategoryScreenProps) {
  const { forceRefresh, getAllItemNumbers } = useInventory();
  const [itemNumbers, setItemNumbers] = useState<ItemNumberEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ItemNumberEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Refresh data from Supabase
   * Memoized to prevent unnecessary re-renders
   */
  const refreshFromSupabase = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`🔄 Fetching items for ${category} from Supabase...`);
      const items = await fetchItemNumbersByCategory(category);
      setItemNumbers(items);
      console.log(`✅ Loaded ${items.length} items for ${category}`);
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      Alert.alert('Error', 'Failed to load items from Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Load items from Supabase on mount and when category changes
  useEffect(() => {
    refreshFromSupabase();
  }, [refreshFromSupabase]);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(itemNumbers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = itemNumbers.filter(item =>
        item.itemNumber.toLowerCase().includes(query) ||
        item.productName?.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, itemNumbers]);

  const handleAddItemNumber = async () => {
    try {
      const newItem: ItemNumberEntry = {
        id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemNumber: '',
        productName: '',
        floorCount: 0,
        storageCount: 0,
        totalCount: 0,
        category,
      };

      setItemNumbers(prev => [newItem, ...prev]);
      console.log('➕ Added new item entry');
    } catch (error) {
      console.error('❌ Error adding item:', error);
      Alert.alert('Error', 'Failed to add new item');
    }
  };

  const handleDeleteItemNumber = async (id: string) => {
    Alert.alert(
      '⚠️ Delete Item',
      'Are you sure you want to delete this item from Supabase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              console.log('🗑️ Deleting item from Supabase:', id);
              
              await deleteItemNumberFromSupabase(id);
              
              // Remove from local state
              setItemNumbers(prev => prev.filter(item => item.id !== id));
              
              // Refresh
              forceRefresh();
              
              console.log('✅ Item deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item from Supabase');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleItemNumberChange = async (id: string, field: keyof ItemNumberEntry, value: string | number) => {
    try {
      // Update local state immediately for responsive UI
      setItemNumbers(prev =>
        prev.map(item => {
          if (item.id === id) {
            const updated = { ...item, [field]: value };
            // Recalculate total if floor or storage count changed
            if (field === 'floorCount' || field === 'storageCount') {
              updated.totalCount = updated.floorCount + updated.storageCount;
            }
            return updated;
          }
          return item;
        })
      );
    } catch (error) {
      console.error('❌ Error updating item:', error);
    }
  };

  const handleSaveItem = async (item: ItemNumberEntry) => {
    try {
      if (!item.itemNumber.trim()) {
        Alert.alert('⚠️ Validation Error', 'Item number is required');
        return;
      }

      setIsSaving(true);
      console.log('💾 Saving item to Supabase:', item.itemNumber);
      
      await upsertItemNumber(item);
      
      // Refresh from Supabase
      await refreshFromSupabase();
      forceRefresh();
      
      console.log('✅ Item saved successfully');
      Alert.alert('✅ Success', 'Item saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving item:', error);
      Alert.alert('❌ Error', 'Failed to save item to Supabase');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCategory = async () => {
    try {
      setIsLoading(true);
      console.log(`📤 Exporting ${title}...`);
      
      const success = await exportCategoryToExcel(title, itemNumbers, []);
      
      if (success) {
        Alert.alert('✅ Export Complete', `Successfully exported ${itemNumbers.length} items from ${title}`);
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert('❌ Export Error', 'Failed to export category');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <IconSymbol name="magnifyingglass" size={16} color={colors.textSecondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search items..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={clearSearch}>
          <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );

  const renderItemNumberRow = (item: ItemNumberEntry, index: number) => (
    <GlassView
      key={item.id}
      style={[styles.itemRow, Platform.OS !== 'ios' && { backgroundColor: colors.card }]}
      glassEffectStyle="regular"
    >
      <View style={styles.itemRowHeader}>
        <Text style={[styles.itemIndex, { color: colors.textSecondary }]}>
          #{index + 1}
        </Text>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteItemNumber(item.id)}
          disabled={isSaving}
        >
          <IconSymbol name="trash.fill" size={16} color="#FF3B30" />
        </Pressable>
      </View>

      <View style={styles.itemInputsContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Item Number *
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder={placeholderExample}
            placeholderTextColor={colors.textSecondary}
            value={item.itemNumber}
            onChangeText={(text) => handleItemNumberChange(item.id, 'itemNumber', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Product Name
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Enter product name"
            placeholderTextColor={colors.textSecondary}
            value={item.productName || ''}
            onChangeText={(text) => handleItemNumberChange(item.id, 'productName', text)}
          />
        </View>

        <View style={styles.countsRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Floor Count
            </Text>
            <TextInput
              style={[styles.input, styles.countInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={item.floorCount.toString()}
              onChangeText={(text) => handleItemNumberChange(item.id, 'floorCount', parseInt(text) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Storage Count
            </Text>
            <TextInput
              style={[styles.input, styles.countInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={item.storageCount.toString()}
              onChangeText={(text) => handleItemNumberChange(item.id, 'storageCount', parseInt(text) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
            <View style={[styles.totalDisplay, { backgroundColor: colors.cardSecondary }]}>
              <Text style={[styles.totalText, { color: colors.text }]}>
                {item.totalCount}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSaveItem(item)}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={16} color="white" />
              <Text style={styles.saveButtonText}>Save to Supabase</Text>
            </>
          )}
        </Pressable>
      </View>
    </GlassView>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <IconSymbol name={icon} size={28} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {itemNumbers.length} items • Total: {itemNumbers.reduce((sum, item) => sum + item.totalCount, 0)}
                </Text>
              </View>
            </View>
          </View>

          {renderSearchBar()}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleAddItemNumber}
              disabled={isLoading}
            >
              <IconSymbol name="plus.circle.fill" size={16} color="white" />
              <Text style={styles.actionButtonText}>Add Item</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={handleExportCategory}
              disabled={isLoading}
            >
              <IconSymbol name="square.and.arrow.up" size={16} color="white" />
              <Text style={styles.actionButtonText}>Export</Text>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading from Supabase...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="tray.fill" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {searchQuery ? 'No items match your search' : 'No items yet. Add your first item!'}
                </Text>
              </View>
            ) : (
              filteredItems.map((item, index) => renderItemNumberRow(item, index))
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
  itemRow: {
    borderRadius: 12,
    padding: 14,
  },
  itemRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIndex: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  itemInputsContainer: {
    gap: 10,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countInput: {
    textAlign: 'center',
  },
  totalDisplay: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
