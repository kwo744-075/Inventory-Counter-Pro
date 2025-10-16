
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { InventoryItem, ItemNumberEntry } from '@/types/inventory';
import { Alert, Platform } from 'react-native';

/**
 * Export all inventory data to Excel with category tabs
 * Supports iOS, Android, and Web platforms
 * Includes change tracking and metadata
 * 
 * @param allItemNumbers - All inventory items to export
 * @param categories - Category definitions
 * @param adjustedItems - Items that have changed since last export
 * @returns Promise<boolean> - Success status
 */
export const exportAllDataWithCategoryTabs = async (
  allItemNumbers: ItemNumberEntry[], 
  categories: any[], 
  adjustedItems?: ItemNumberEntry[]
): Promise<boolean> => {
  try {
    console.log('🚀 Starting Excel export with category tabs...');
    
    // Validation
    if (!allItemNumbers || allItemNumbers.length === 0) {
      Alert.alert('⚠️ No Data', 'There are no items to export.');
      return false;
    }

    if (!categories || categories.length === 0) {
      Alert.alert('⚠️ No Categories', 'There are no categories available.');
      return false;
    }

    const workbook = XLSX.utils.book_new();
    let totalSheetsCreated = 0;
    const adjustedItemNumbers = new Set(adjustedItems?.map(item => item.itemNumber) || []);
    const exportTimestamp = new Date().toLocaleString();
    const exportUser = 'Current User';

    // Create summary sheet
    console.log('📋 Creating summary sheet...');
    
    const summaryData = [
      ['Take 5 Inventory Export'],
      ['Export Date:', exportTimestamp],
      ['Exported By:', exportUser],
      ['Total Items:', allItemNumbers.length],
      ['Total Categories:', categories.length],
      ['Items Changed Since Last Export:', adjustedItems?.length || 0],
      [],
      ['#', 'Product Name', 'Item Number', 'Category', 'Floor Count', 'Storage Count', 'Total Count', 'Changed'],
    ];

    allItemNumbers.forEach((item, index) => {
      const category = categories.find(cat => cat.id === item.category);
      summaryData.push([
        index + 1,
        item.productName || '',
        item.itemNumber || '',
        category?.name || item.category || 'Unknown',
        item.floorCount || 0,
        item.storageCount || 0,
        item.totalCount || 0,
        adjustedItemNumbers.has(item.itemNumber) ? 'YES' : 'NO',
      ]);
    });

    // Add totals
    const totalFloor = allItemNumbers.reduce((sum, item) => sum + (item.floorCount || 0), 0);
    const totalStorage = allItemNumbers.reduce((sum, item) => sum + (item.storageCount || 0), 0);
    const grandTotal = allItemNumbers.reduce((sum, item) => sum + (item.totalCount || 0), 0);
    
    summaryData.push([
      '',
      '',
      'GRAND TOTALS',
      '',
      totalFloor,
      totalStorage,
      grandTotal,
      `${adjustedItems?.length || 0} changed`,
    ]);

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for better readability
    summaryWorksheet['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    totalSheetsCreated++;

    // Create category sheets
    for (const category of categories) {
      const categoryItems = allItemNumbers.filter(item => item.category === category.id);
      
      if (categoryItems.length === 0) continue;

      const categoryData = [
        [`${category.name} - Take 5 Inventory`],
        ['Export Date:', exportTimestamp],
        ['Exported By:', exportUser],
        ['Category:', category.name],
        ['Total Items:', categoryItems.length],
        [],
        ['#', 'Product Name', 'Item Number', 'Floor Count', 'Storage Count', 'Total Count', 'Changed'],
      ];

      categoryItems.forEach((item, index) => {
        categoryData.push([
          index + 1,
          item.productName || '',
          item.itemNumber || '',
          item.floorCount || 0,
          item.storageCount || 0,
          item.totalCount || 0,
          adjustedItemNumbers.has(item.itemNumber) ? 'YES' : 'NO',
        ]);
      });

      // Add category totals
      const categoryTotalFloor = categoryItems.reduce((sum, item) => sum + (item.floorCount || 0), 0);
      const categoryTotalStorage = categoryItems.reduce((sum, item) => sum + (item.storageCount || 0), 0);
      const categoryGrandTotal = categoryItems.reduce((sum, item) => sum + (item.totalCount || 0), 0);
      const categoryAdjustedCount = categoryItems.filter(item => adjustedItemNumbers.has(item.itemNumber)).length;
      
      categoryData.push([
        '',
        '',
        'CATEGORY TOTALS',
        categoryTotalFloor,
        categoryTotalStorage,
        categoryGrandTotal,
        `${categoryAdjustedCount} changed`,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(categoryData);
      
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 20 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
      ];

      // Sanitize sheet name (Excel has restrictions)
      let sheetName = category.name.replace(/[\\/?*[\]]/g, '').substring(0, 31);
      
      const existingSheetNames = XLSX.utils.book_get_ws_names(workbook);
      let counter = 1;
      let originalSheetName = sheetName;
      while (existingSheetNames.includes(sheetName)) {
        sheetName = `${originalSheetName.substring(0, 28)}_${counter}`;
        counter++;
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      totalSheetsCreated++;
    }

    if (totalSheetsCreated === 0) {
      Alert.alert('⚠️ No Data', 'No data was found to export.');
      return false;
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx' 
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `take5_inventory_${timestamp}.xlsx`;

    // Platform-specific file handling
    if (Platform.OS === 'web') {
      console.log('📤 Exporting for web...');
      const uint8Array = Uint8Array.from(atob(excelBuffer), c => c.charCodeAt(0));
      const blob = new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } else {
      console.log('📤 Exporting for mobile...');
      const cacheDirectory = FileSystemLegacy.cacheDirectory;
      if (!cacheDirectory) {
        throw new Error('Cache directory is not available');
      }
      const fileUri = cacheDirectory + filename;
      
      await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Take 5 Inventory',
        });
      } else {
        Alert.alert('✅ Export Complete', `File saved to: ${fileUri}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Excel export error:', error);
    Alert.alert(
      '❌ Export Failed',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Export a single category to Excel
 * Supports iOS, Android, and Web platforms
 * 
 * @param categoryName - Name of the category
 * @param itemNumbers - Items in the category
 * @param adjustedItems - Items that have changed
 * @returns Promise<boolean> - Success status
 */
export const exportCategoryToExcel = async (
  categoryName: string, 
  itemNumbers: ItemNumberEntry[], 
  adjustedItems?: ItemNumberEntry[]
): Promise<boolean> => {
  try {
    console.log(`🚀 Starting Excel export for ${categoryName}...`);

    if (!itemNumbers || itemNumbers.length === 0) {
      Alert.alert('⚠️ No Data', `There are no items in ${categoryName} to export.`);
      return false;
    }

    const adjustedItemNumbers = new Set(adjustedItems?.map(item => item.itemNumber) || []);
    const exportTimestamp = new Date().toLocaleString();
    const exportUser = 'Current User';

    const excelData = [
      [`${categoryName} - Take 5 Inventory`],
      ['Export Date:', exportTimestamp],
      ['Exported By:', exportUser],
      ['Category:', categoryName],
      ['Total Items:', itemNumbers.length],
      [],
      ['#', 'Product Name', 'Item Number', 'Floor Count', 'Storage Count', 'Total Count', 'Changed'],
    ];

    itemNumbers.forEach((item, index) => {
      excelData.push([
        index + 1,
        item.productName || '',
        item.itemNumber || '',
        item.floorCount || 0,
        item.storageCount || 0,
        item.totalCount || 0,
        adjustedItemNumbers.has(item.itemNumber) ? 'YES' : 'NO',
      ]);
    });

    const totalFloor = itemNumbers.reduce((sum, item) => sum + (item.floorCount || 0), 0);
    const totalStorage = itemNumbers.reduce((sum, item) => sum + (item.storageCount || 0), 0);
    const grandTotal = itemNumbers.reduce((sum, item) => sum + (item.totalCount || 0), 0);
    const adjustedCount = itemNumbers.filter(item => adjustedItemNumbers.has(item.itemNumber)).length;
    
    excelData.push([
      '',
      '',
      'TOTALS',
      totalFloor,
      totalStorage,
      grandTotal,
      `${adjustedCount} changed`,
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, categoryName);

    const excelBuffer = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx' 
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${categoryName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Platform-specific file handling
    if (Platform.OS === 'web') {
      console.log('📤 Exporting for web...');
      const uint8Array = Uint8Array.from(atob(excelBuffer), c => c.charCodeAt(0));
      const blob = new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } else {
      console.log('📤 Exporting for mobile...');
      const cacheDirectory = FileSystemLegacy.cacheDirectory;
      if (!cacheDirectory) {
        throw new Error('Cache directory is not available');
      }
      const fileUri = cacheDirectory + filename;
      
      await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Export ${categoryName}`,
        });
      } else {
        Alert.alert('✅ Export Complete', `File saved to: ${fileUri}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Excel export error:', error);
    Alert.alert(
      '❌ Export Failed',
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
    return false;
  }
};
