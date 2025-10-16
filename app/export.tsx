
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { colors } from '@/styles/commonStyles';
import { useInventory } from '@/contexts/InventoryContext';
import { IconSymbol } from '@/components/IconSymbol';
import { InventoryCategory } from '@/types/inventory';
import { exportAllDataWithCategoryTabs, exportCategoryToExcel } from '@/utils/excelExport';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { 
  bulkUpsertItemNumbers, 
  fetchAllItemNumbers, 
  logUploadToSupabase,
  saveExportSnapshot,
  fetchLatestExportSnapshot
} from '@/services/supabaseHelpers';
import { ItemNumberEntry } from '@/types/inventory';

interface UploadSummary {
  totalItems: number;
  categoryCounts: { [key: string]: number };
  timestamp: Date;
  uploaderId?: string;
  fileName?: string;
  newItems: number;
  updatedItems: number;
  skippedItems: number;
  errors: string[];
}

interface ParsedItem {
  item_number: string;
  product_name?: string;
  floor_count: number;
  storage_count: number;
  category: string;
}

/**
 * Export Screen Component
 * Handles Excel import/export with full Supabase integration
 * Supports iOS, Android, and Web platforms
 */
export default function ExportScreen() {
  const { 
    categories, 
    getAllItemNumbers, 
    forceRefresh
  } = useInventory();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);

  /**
   * Export all data to Excel with category tabs
   * Includes change tracking and metadata
   */
  const handleExportAll = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting Export All with Supabase integration...');
      
      // Fetch fresh data from Supabase
      const allItemNumbers = await fetchAllItemNumbers();
      
      if (allItemNumbers.length === 0) {
        Alert.alert('⚠️ No Data', 'There are no items to export. Please add items first.');
        return;
      }
      
      // Fetch last export snapshot to determine changed items
      const lastSnapshot = await fetchLatestExportSnapshot();
      const adjustedItems = getAdjustedItems(allItemNumbers, lastSnapshot || []);
      
      console.log(`📊 Exporting ${allItemNumbers.length} items, ${adjustedItems.length} changed since last export`);
      
      const success = await exportAllDataWithCategoryTabs(allItemNumbers, categories, adjustedItems);
      
      if (success) {
        // Save export snapshot to Supabase
        await saveExportSnapshot(allItemNumbers);
        setLastExportDate(new Date());
        
        Alert.alert(
          '✅ Export Complete',
          `Successfully exported ${allItemNumbers.length} items across ${categories.length} categories.\n\n${adjustedItems.length} items were marked as changed since last export.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Export all error:', error);
      Alert.alert(
        '❌ Export Error',
        `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export a single category to Excel
   */
  const handleExportCategory = async (categoryId: string) => {
    setIsLoading(true);
    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) {
        Alert.alert('Error', 'Category not found');
        return;
      }

      // Fetch fresh data from Supabase
      const allItemNumbers = await fetchAllItemNumbers();
      const categoryItems = allItemNumbers.filter(item => item.category === categoryId);
      
      if (categoryItems.length === 0) {
        Alert.alert('⚠️ No Data', `There are no items in ${category.name} to export.`);
        return;
      }
      
      // Get last snapshot for change tracking
      const lastSnapshot = await fetchLatestExportSnapshot();
      const adjustedItems = getAdjustedItems(categoryItems, lastSnapshot || []);
      
      const success = await exportCategoryToExcel(category.name, categoryItems, adjustedItems);
      
      if (success) {
        Alert.alert(
          '✅ Export Complete',
          `Successfully exported ${categoryItems.length} items from ${category.name}.\n\n${adjustedItems.length} items were marked as changed.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Export category error:', error);
      Alert.alert(
        '❌ Export Error',
        `Failed to export category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Determine which items have changed since last export
   */
  const getAdjustedItems = (currentItems: ItemNumberEntry[], snapshotItems: ItemNumberEntry[]): ItemNumberEntry[] => {
    if (snapshotItems.length === 0) {
      return currentItems;
    }

    const adjustedItems: ItemNumberEntry[] = [];
    
    currentItems.forEach(currentItem => {
      const snapshotItem = snapshotItems.find(snap => snap.itemNumber === currentItem.itemNumber);
      
      if (!snapshotItem) {
        adjustedItems.push(currentItem);
      } else {
        const floorChanged = currentItem.floorCount !== snapshotItem.floorCount;
        const storageChanged = currentItem.storageCount !== snapshotItem.storageCount;
        const nameChanged = currentItem.productName !== snapshotItem.productName;
        
        if (floorChanged || storageChanged || nameChanged) {
          adjustedItems.push(currentItem);
        }
      }
    });
    
    return adjustedItems;
  };

  /**
   * Validate Excel file has required columns
   */
  const validateExcelColumns = (headers: string[]): { valid: boolean; missing: string[] } => {
    const REQUIRED_COLUMNS = ['itemNumber', 'FloorCount', 'StorageCount', 'Category'];
    const missing: string[] = [];

    for (const required of REQUIRED_COLUMNS) {
      const found = headers.some(h => 
        h.toLowerCase().replace(/[\s_-]/g, '') === required.toLowerCase().replace(/[\s_-]/g, '')
      );
      if (!found) {
        missing.push(required);
      }
    }

    return { valid: missing.length === 0, missing };
  };

  /**
   * Parse a single Excel row into structured data
   * Handles flexible column naming and category matching
   */
  const parseExcelRow = (values: string[], headers: string[], rowIndex: number): ParsedItem | null => {
    try {
      // Find column indices (case-insensitive, flexible matching)
      const findIndex = (patterns: string[]) => {
        return headers.findIndex(h => {
          const normalized = h.toLowerCase().replace(/[\s_-]/g, '');
          return patterns.some(p => normalized.includes(p.toLowerCase().replace(/[\s_-]/g, '')));
        });
      };

      const itemNumberIndex = findIndex(['itemnumber', 'item', 'sku', 'code']);
      const productNameIndex = findIndex(['productname', 'product', 'name', 'description']);
      const floorCountIndex = findIndex(['floorcount', 'floor']);
      const storageCountIndex = findIndex(['storagecount', 'storage', 'warehouse', 'stock']);
      const categoryIndex = findIndex(['category', 'type', 'group']);

      if (itemNumberIndex === -1 || floorCountIndex === -1 || storageCountIndex === -1 || categoryIndex === -1) {
        console.error(`❌ Row ${rowIndex}: Missing required columns`);
        return null;
      }

      const itemNumber = values[itemNumberIndex]?.trim();
      if (!itemNumber) {
        console.error(`❌ Row ${rowIndex}: Empty item number`);
        return null;
      }

      const productName = productNameIndex !== -1 ? values[productNameIndex]?.trim() : undefined;
      const floorCount = parseInt(values[floorCountIndex]?.trim() || '0') || 0;
      const storageCount = parseInt(values[storageCountIndex]?.trim() || '0') || 0;
      const categoryStr = values[categoryIndex]?.trim().toLowerCase();

      // Match category with flexible matching
      const matchedCategory = categories.find(cat => {
        const catName = cat.name.toLowerCase();
        const catId = cat.id.toLowerCase();
        const normalized = categoryStr.replace(/[\s_-]/g, '');
        const catNameNorm = catName.replace(/[\s_-]/g, '');
        const catIdNorm = catId.replace(/[\s_-]/g, '');
        
        return (
          catName === categoryStr ||
          catId === categoryStr ||
          catNameNorm === normalized ||
          catIdNorm === normalized ||
          catName.includes(categoryStr) ||
          categoryStr.includes(catName)
        );
      });

      if (!matchedCategory) {
        console.error(`❌ Row ${rowIndex}: Could not match category "${categoryStr}"`);
        return null;
      }

      return {
        item_number: itemNumber,
        product_name: productName,
        floor_count: floorCount,
        storage_count: storageCount,
        category: matchedCategory.id,
      };
    } catch (error) {
      console.error(`❌ Row ${rowIndex} parsing error:`, error);
      return null;
    }
  };

  /**
   * Handle Excel file import
   * Single-step process: Select → Parse → Validate → Upsert → Summary
   * Works on iOS, Android, and Web
   */
  const handleImportExcel = async () => {
    try {
      setIsLoading(true);
      setUploadStatus('uploading');
      console.log('🚀 Starting one-step Supabase import...');

      // Step 1: File Selection
      console.log('📂 Step 1: Selecting file...');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('📂 User cancelled file selection');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      console.log('📂 Selected file:', file.name);

      if (!file.uri) {
        Alert.alert('❌ Error', 'Invalid file selected');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      // Step 2: Read File (cross-platform compatible)
      console.log('📖 Step 2: Reading file...');
      let fileContent: string;
      
      try {
        if (Platform.OS === 'web') {
          // Web: Use fetch to read the file
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          fileContent = btoa(String.fromCharCode(...uint8Array));
        } else {
          // iOS/Android: Use FileSystem
          fileContent = await FileSystemLegacy.readAsStringAsync(file.uri, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
        }
      } catch (readError) {
        console.error('❌ File read error:', readError);
        Alert.alert('❌ Error', 'Failed to read file. Please try again.');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      if (!fileContent || fileContent.length === 0) {
        Alert.alert('❌ Error', 'File is empty or could not be read');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      // Step 3: Parse Excel
      console.log('📊 Step 3: Parsing Excel file...');
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        Alert.alert('❌ Error', 'No sheets found in Excel file');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csvData = XLSX.utils.sheet_to_csv(worksheet);

      if (!csvData || csvData.trim().length === 0) {
        Alert.alert('❌ Error', 'Worksheet appears to be empty');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        Alert.alert('❌ Error', 'File must contain headers and at least one data row');
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      // Step 4: Validate Headers
      console.log('✅ Step 4: Validating headers...');
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      console.log('📋 Headers found:', headers);

      const validation = validateExcelColumns(headers);
      if (!validation.valid) {
        Alert.alert(
          '❌ Invalid File Format',
          `Missing required columns: ${validation.missing.join(', ')}\n\nExpected: ProductName, itemNumber, FloorCount, StorageCount, Category`,
          [{ text: 'OK' }]
        );
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      // Step 5: Parse Data Rows
      console.log('📊 Step 5: Parsing data rows...');
      const parsedItems: ParsedItem[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const parsed = parseExcelRow(values, headers, i + 1);

        if (parsed) {
          parsedItems.push(parsed);
        } else {
          errors.push(`Row ${i + 1}: Failed to parse`);
        }
      }

      console.log(`📊 Parsed ${parsedItems.length} items with ${errors.length} errors`);

      if (parsedItems.length === 0) {
        Alert.alert(
          '❌ No Valid Data',
          `Could not parse any valid items from the file.\n\n${errors.slice(0, 3).join('\n')}`,
          [{ text: 'OK' }]
        );
        setUploadStatus('idle');
        setIsLoading(false);
        return;
      }

      // Step 6: Fetch existing items to determine new vs updated
      console.log('💾 Step 6: Fetching existing items from Supabase...');
      const existingItems = await fetchAllItemNumbers();
      const existingItemNumbers = new Set(existingItems.map(item => item.itemNumber.toLowerCase()));

      // Step 7: Prepare items for upsert
      console.log('💾 Step 7: Preparing items for upsert...');
      const itemsToUpsert: ItemNumberEntry[] = parsedItems.map((item, index) => ({
        id: `import_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        itemNumber: item.item_number,
        productName: item.product_name,
        floorCount: item.floor_count,
        storageCount: item.storage_count,
        totalCount: item.floor_count + item.storage_count,
        category: item.category as InventoryCategory,
      }));

      const newItems = itemsToUpsert.filter(item => !existingItemNumbers.has(item.itemNumber.toLowerCase()));
      const updatedItems = itemsToUpsert.filter(item => existingItemNumbers.has(item.itemNumber.toLowerCase()));

      console.log(`📊 New items: ${newItems.length}, Updated items: ${updatedItems.length}`);

      // Step 8: Bulk upsert to Supabase
      console.log('💾 Step 8: Bulk upserting to Supabase...');
      await bulkUpsertItemNumbers(itemsToUpsert, 'excel_import');

      // Step 9: Calculate Category Counts
      console.log('📊 Step 9: Calculating category counts...');
      const allItemsAfterImport = await fetchAllItemNumbers();
      const categoryCounts: { [key: string]: number } = {};
      categories.forEach(cat => {
        const count = allItemsAfterImport.filter(item => item.category === cat.id).length;
        categoryCounts[cat.name] = count;
      });

      // Step 10: Create Summary
      console.log('📝 Step 10: Creating upload summary...');
      const summary: UploadSummary = {
        totalItems: parsedItems.length,
        categoryCounts,
        timestamp: new Date(),
        fileName: file.name,
        newItems: newItems.length,
        updatedItems: updatedItems.length,
        skippedItems: errors.length,
        errors: errors.slice(0, 10),
      };

      setUploadSummary(summary);
      setUploadStatus('complete');
      setShowSummaryModal(true);

      // Step 11: Log to Supabase
      console.log('📝 Step 11: Logging upload to Supabase...');
      await logUploadToSupabase({
        total_items: summary.totalItems,
        category_counts: summary.categoryCounts,
        timestamp: summary.timestamp.toISOString(),
        file_name: summary.fileName,
        new_items: summary.newItems,
        updated_items: summary.updatedItems,
        skipped_items: summary.skippedItems,
      });

      // Step 12: Refresh local state
      console.log('🔄 Step 12: Refreshing local state...');
      forceRefresh();
      setTimeout(() => forceRefresh(), 300);
      setTimeout(() => forceRefresh(), 800);

      console.log('✅ Import complete!');

    } catch (error) {
      console.error('❌ Import error:', error);
      Alert.alert(
        '❌ Import Failed',
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the file format and try again.`,
        [{ text: 'OK' }]
      );
      setUploadStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategorySummary = (category: any) => {
    const allItemNumbers = getAllItemNumbers();
    const categoryItems = allItemNumbers.filter(item => item.category === category.id);
    const totalCount = categoryItems.reduce((sum, item) => sum + item.totalCount, 0);

    return (
      <GlassView
        key={category.id}
        style={[styles.categoryCard, Platform.OS !== 'ios' && { backgroundColor: colors.card }]}
        glassEffectStyle="regular"
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <IconSymbol name={category.icon} color="white" size={16} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {category.name}
            </Text>
            <Text style={[styles.categoryStats, { color: colors.textSecondary }]}>
              {categoryItems.length} items • {totalCount} total
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.exportButton, { backgroundColor: category.color }]}
          onPress={() => handleExportCategory(category.id)}
          disabled={isLoading}
        >
          <IconSymbol name="square.and.arrow.up" color="white" size={12} />
          <Text style={styles.exportButtonText}>Export</Text>
        </Pressable>
      </GlassView>
    );
  };

  const allItemNumbers = getAllItemNumbers();

  const getButtonText = () => {
    if (uploadStatus === 'uploading') return 'Uploading...';
    if (uploadStatus === 'complete') return 'Upload Complete!';
    return 'Import Excel File';
  };

  const getButtonColor = () => {
    if (uploadStatus === 'complete') return '#34C759';
    return colors.accent;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Import & Export',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Import & Export
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Export inventory to Excel or import from Excel files
            </Text>
            {lastExportDate && (
              <Text style={[styles.lastExportText, { color: colors.textSecondary }]}>
                Last export: {lastExportDate.toLocaleDateString()} at {lastExportDate.toLocaleTimeString()}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📥 Import from Excel
            </Text>
            
            <Pressable
              style={styles.actionButtonPressable}
              onPress={handleImportExcel}
              disabled={isLoading}
            >
              <GlassView
                style={[
                  styles.actionButton, 
                  styles.importButton, 
                  Platform.OS !== 'ios' && { backgroundColor: getButtonColor() }
                ]}
                glassEffectStyle="regular"
              >
                <IconSymbol 
                  name={uploadStatus === 'complete' ? 'checkmark.circle.fill' : 'square.and.arrow.down'} 
                  color="white" 
                  size={18} 
                />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>
                    {getButtonText()}
                  </Text>
                  <Text style={styles.actionButtonSubtitle}>
                    {uploadStatus === 'uploading' 
                      ? 'Processing your file...' 
                      : uploadStatus === 'complete'
                      ? 'Data successfully uploaded to Supabase'
                      : 'Upload Excel file with inventory data'}
                  </Text>
                </View>
                {isLoading && <ActivityIndicator color="white" size="small" />}
              </GlassView>
            </Pressable>

            <View style={styles.instructionsContainer}>
              <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                📋 Required Column Headers
              </Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                - <Text style={{ fontWeight: '700' }}>ProductName</Text> - Item description
              </Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                - <Text style={{ fontWeight: '700' }}>itemNumber</Text> - Unique identifier
              </Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                - <Text style={{ fontWeight: '700' }}>FloorCount</Text> - Floor quantity
              </Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                - <Text style={{ fontWeight: '700' }}>StorageCount</Text> - Storage quantity
              </Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                - <Text style={{ fontWeight: '700' }}>Category</Text> - Must match: {categories.map(cat => cat.name).join(', ')}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📤 Export Options
            </Text>
            
            <Pressable
              style={styles.actionButtonPressable}
              onPress={handleExportAll}
              disabled={isLoading}
            >
              <GlassView
                style={[styles.actionButton, styles.primaryButton, Platform.OS !== 'ios' && { backgroundColor: colors.primary }]}
                glassEffectStyle="regular"
              >
                <IconSymbol name="square.and.arrow.up" color="white" size={18} />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>Export All → Excel</Text>
                  <Text style={styles.actionButtonSubtitle}>
                    {allItemNumbers.length} items • {categories.length} categories
                  </Text>
                </View>
                {isLoading && <ActivityIndicator color="white" size="small" />}
              </GlassView>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Export by Category
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map(renderCategorySummary)}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Upload Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSummaryModal(false);
          setUploadStatus('idle');
        }}
      >
        <View style={styles.modalOverlay}>
          <GlassView
            style={[styles.modalContent, Platform.OS !== 'ios' && { backgroundColor: colors.card }]}
            glassEffectStyle="regular"
          >
            <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
              <IconSymbol name="checkmark.circle.fill" size={36} color="white" />
              <Text style={styles.modalTitle}>Upload Complete!</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  ✅ Total Items Processed:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {uploadSummary?.totalItems || 0}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  🆕 New Items:
                </Text>
                <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                  {uploadSummary?.newItems || 0}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  🔄 Updated Items:
                </Text>
                <Text style={[styles.summaryValue, { color: '#007AFF' }]}>
                  {uploadSummary?.updatedItems || 0}
                </Text>
              </View>

              {(uploadSummary?.skippedItems || 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    ⚠️ Skipped/Errors:
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#FF9500' }]}>
                    {uploadSummary?.skippedItems || 0}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  🕒 Timestamp:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {uploadSummary?.timestamp.toLocaleString()}
                </Text>
              </View>

              {uploadSummary?.fileName && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    📄 File Name:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1}>
                    {uploadSummary.fileName}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={[styles.categoryBreakdownTitle, { color: colors.text }]}>
                🗂 Items per Category:
              </Text>
              {uploadSummary && Object.entries(uploadSummary.categoryCounts).map(([category, count]) => (
                <View key={category} style={styles.categoryBreakdownRow}>
                  <Text style={[styles.categoryBreakdownLabel, { color: colors.textSecondary }]}>
                    {category}:
                  </Text>
                  <Text style={[styles.categoryBreakdownValue, { color: colors.text }]}>
                    {count} items
                  </Text>
                </View>
              ))}

              {uploadSummary && uploadSummary.errors.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={[styles.categoryBreakdownTitle, { color: '#FF3B30' }]}>
                    ⚠️ Errors:
                  </Text>
                  {uploadSummary.errors.map((error, index) => (
                    <Text key={index} style={[styles.errorText, { color: colors.textSecondary }]}>
                      • {error}
                    </Text>
                  ))}
                </>
              )}
            </View>

            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowSummaryModal(false);
                setUploadStatus('idle');
              }}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </Pressable>
          </GlassView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  lastExportText: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  actionButtonPressable: {
    marginBottom: 8,
  },
  actionButton: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  importButton: {
    backgroundColor: colors.accent,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoriesGrid: {
    gap: 8,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStats: {
    fontSize: 11,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 3,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.cardSecondary,
    borderRadius: 10,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  modalBody: {
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    flex: 1,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  categoryBreakdownTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryBreakdownLabel: {
    fontSize: 13,
  },
  categoryBreakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 11,
    marginBottom: 3,
    lineHeight: 14,
  },
  modalButton: {
    margin: 18,
    marginTop: 0,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
