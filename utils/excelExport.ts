
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { InventoryItem, ItemNumberEntry } from '@/types/inventory';
import { Alert, Platform } from 'react-native';

export const exportToExcel = async (items: InventoryItem[], itemNumbers?: ItemNumberEntry[]) => {
  try {
    console.log('🚀 Starting Excel export with', items.length, 'items and', itemNumbers?.length || 0, 'item numbers');

    // Show initial feedback
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Export Starting',
        'Creating Excel file... This may take a moment.',
        [{ text: 'OK' }]
      );
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    let hasData = false;

    // Prepare legacy items data for Excel (if any)
    if (items && items.length > 0) {
      console.log('📋 Processing', items.length, 'legacy items...');
      const excelData = items.map(item => ({
        'Item Name': item.name || '',
        'Category': item.category ? item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
        'Quantity': item.quantity || 0,
        'Description': item.description || '',
        'Created Date': item.createdAt ? item.createdAt.toLocaleDateString() : '',
        'Last Updated': item.updatedAt ? item.updatedAt.toLocaleDateString() : '',
      }));

      // Add summary row
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      excelData.push({
        'Item Name': 'TOTAL',
        'Category': '',
        'Quantity': totalItems,
        'Description': `Total of ${items.length} unique items`,
        'Created Date': '',
        'Last Updated': new Date().toLocaleDateString(),
      });

      // Create worksheet for legacy items
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Item Name
        { wch: 15 }, // Category
        { wch: 10 }, // Quantity
        { wch: 30 }, // Description
        { wch: 12 }, // Created Date
        { wch: 12 }, // Last Updated
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Legacy Items');
      hasData = true;
      console.log('✅ Added legacy items worksheet');
    }

    // Prepare item numbers data for Excel
    if (itemNumbers && itemNumbers.length > 0) {
      console.log('📋 Processing', itemNumbers.length, 'item numbers...');
      const itemNumbersData = itemNumbers.map(item => ({
        'Product Name': item.productName || '',
        'Item Number': item.itemNumber || '',
        'Category': item.category ? item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
        'Floor Count': item.floorCount || 0,
        'Storage Count': item.storageCount || 0,
        'Total Count': item.totalCount || 0,
      }));

      // Add summary row for item numbers
      const totalFloor = itemNumbers.reduce((sum, item) => sum + (item.floorCount || 0), 0);
      const totalStorage = itemNumbers.reduce((sum, item) => sum + (item.storageCount || 0), 0);
      const grandTotal = itemNumbers.reduce((sum, item) => sum + (item.totalCount || 0), 0);
      
      itemNumbersData.push({
        'Product Name': '',
        'Item Number': 'TOTALS',
        'Category': '',
        'Floor Count': totalFloor,
        'Storage Count': totalStorage,
        'Total Count': grandTotal,
      });

      // Create worksheet for item numbers
      const itemNumbersWorksheet = XLSX.utils.json_to_sheet(itemNumbersData);

      // Set column widths for item numbers
      const itemNumbersColumnWidths = [
        { wch: 25 }, // Product Name
        { wch: 20 }, // Item Number
        { wch: 15 }, // Category
        { wch: 12 }, // Floor Count
        { wch: 15 }, // Storage Count
        { wch: 12 }, // Total Count
      ];
      itemNumbersWorksheet['!cols'] = itemNumbersColumnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, itemNumbersWorksheet, 'Item Numbers');
      hasData = true;
      console.log('✅ Added item numbers worksheet');
    }

    if (!hasData) {
      console.warn('⚠️ No data to export');
      Alert.alert(
        '⚠️ No Data',
        'There is no data to export. Please add some inventory items first.',
        [{ text: 'OK' }]
      );
      return false;
    }

    console.log('📊 Excel workbook created with', XLSX.utils.book_get_ws_names(workbook).length, 'worksheets');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx' 
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventory_export_${timestamp}.xlsx`;

    console.log('💾 Generated Excel file:', filename);

    if (Platform.OS === 'web') {
      // For web, create a download link
      try {
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
        
        Alert.alert(
          '✅ Export Complete',
          `File downloaded as ${filename}`,
          [{ text: 'OK' }]
        );
        console.log('✅ Web export completed successfully');
      } catch (webError) {
        console.error('❌ Web export error:', webError);
        throw webError;
      }
    } else {
      // For mobile devices - use FileSystem API
      try {
        // Get the cache directory - use FileSystemLegacy for compatibility
        const cacheDirectory = FileSystemLegacy.cacheDirectory;
        if (!cacheDirectory) {
          throw new Error('Cache directory is not available');
        }
        const fileUri = cacheDirectory + filename;
        
        // Write base64 data to file using FileSystemLegacy
        await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        console.log('📱 Excel file saved to:', fileUri);

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('📤 Sharing available:', isAvailable);

        if (isAvailable) {
          console.log('🔄 Opening share dialog...');
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Inventory to Excel',
          });
          console.log('✅ Share dialog completed');
        } else {
          Alert.alert(
            '✅ Export Complete',
            `File saved as ${filename} in your cache folder.\n\nFile location: ${fileUri}`,
            [{ text: 'OK' }]
          );
        }
      } catch (mobileError) {
        console.error('❌ Mobile export error:', mobileError);
        throw mobileError;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Excel export error:', error);
    Alert.alert(
      '❌ Export Failed',
      `There was an error exporting your inventory: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your device storage.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

// Fixed and enhanced function to export all data with separate tabs for each category
export const exportAllDataWithCategoryTabs = async (allItemNumbers: ItemNumberEntry[], categories: any[]) => {
  try {
    console.log('🚀 Starting Excel export with category tabs for', allItemNumbers.length, 'total item numbers');
    console.log('📊 Available categories:', categories.map(cat => `${cat.name} (${cat.id})`));
    
    // Check if we have any data to export
    if (!allItemNumbers || allItemNumbers.length === 0) {
      console.warn('⚠️ No item numbers to export');
      Alert.alert(
        '⚠️ No Data',
        'There are no item numbers to export. Please add some inventory items first.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!categories || categories.length === 0) {
      console.warn('⚠️ No categories available');
      Alert.alert(
        '⚠️ No Categories',
        'There are no categories available for export.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Show initial feedback
    Alert.alert(
      'Export Starting',
      'Creating Excel file with separate tabs for each category... This may take a moment.',
      [{ text: 'OK' }]
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();
    let totalSheetsCreated = 0;

    // Create a summary sheet with all categories combined first
    console.log('📋 Creating summary sheet with all data...');
    
    const summaryData = allItemNumbers.map((item, index) => {
      const category = categories.find(cat => cat.id === item.category);
      return {
        '#': index + 1,
        'Product Name': item.productName || '',
        'Item Number': item.itemNumber || '',
        'Category': category?.name || item.category || 'Unknown',
        'Floor Count': item.floorCount || 0,
        'Storage Count': item.storageCount || 0,
        'Total Count': item.totalCount || 0,
      };
    });

    // Add grand totals to summary
    const totalFloor = allItemNumbers.reduce((sum, item) => sum + (item.floorCount || 0), 0);
    const totalStorage = allItemNumbers.reduce((sum, item) => sum + (item.storageCount || 0), 0);
    const grandTotal = allItemNumbers.reduce((sum, item) => sum + (item.totalCount || 0), 0);
    
    summaryData.push({
      '#': '',
      'Product Name': '',
      'Item Number': 'GRAND TOTALS',
      'Category': '',
      'Floor Count': totalFloor,
      'Storage Count': totalStorage,
      'Total Count': grandTotal,
    });

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);

    // Set column widths for summary
    const summaryColumnWidths = [
      { wch: 5 },  // #
      { wch: 25 }, // Product Name
      { wch: 20 }, // Item Number
      { wch: 15 }, // Category
      { wch: 12 }, // Floor Count
      { wch: 15 }, // Storage Count
      { wch: 12 }, // Total Count
    ];
    summaryWorksheet['!cols'] = summaryColumnWidths;

    // Add summary worksheet as the first sheet
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'All Categories');
    totalSheetsCreated++;
    console.log('✅ Added summary worksheet');

    // Group items by category and create individual sheets
    for (const category of categories) {
      console.log(`📋 Processing category: ${category.name} (${category.id})`);
      
      // Filter items for this category
      const categoryItems = allItemNumbers.filter(item => item.category === category.id);
      
      console.log(`📊 Found ${categoryItems.length} items for category ${category.name}`);

      // Skip empty categories
      if (categoryItems.length === 0) {
        console.log(`⏭️ Skipping empty category: ${category.name}`);
        continue;
      }

      // Prepare data for this category
      const categoryData = categoryItems.map((item, index) => ({
        '#': index + 1,
        'Product Name': item.productName || '',
        'Item Number': item.itemNumber || '',
        'Floor Count': item.floorCount || 0,
        'Storage Count': item.storageCount || 0,
        'Total Count': item.totalCount || 0,
      }));

      // Add summary row for this category
      const categoryTotalFloor = categoryItems.reduce((sum, item) => sum + (item.floorCount || 0), 0);
      const categoryTotalStorage = categoryItems.reduce((sum, item) => sum + (item.storageCount || 0), 0);
      const categoryGrandTotal = categoryItems.reduce((sum, item) => sum + (item.totalCount || 0), 0);
      
      categoryData.push({
        '#': '',
        'Product Name': '',
        'Item Number': 'CATEGORY TOTALS',
        'Floor Count': categoryTotalFloor,
        'Storage Count': categoryTotalStorage,
        'Total Count': categoryGrandTotal,
      });

      // Create worksheet for this category
      const worksheet = XLSX.utils.json_to_sheet(categoryData);

      // Set column widths
      const columnWidths = [
        { wch: 5 },  // #
        { wch: 25 }, // Product Name
        { wch: 20 }, // Item Number
        { wch: 12 }, // Floor Count
        { wch: 15 }, // Storage Count
        { wch: 12 }, // Total Count
      ];
      worksheet['!cols'] = columnWidths;

      // Clean up category name for sheet name (Excel has restrictions on sheet names)
      // Excel sheet names cannot exceed 31 characters and cannot contain certain characters
      let sheetName = category.name
        .replace(/[\\/?*[\]]/g, '') // Remove invalid characters
        .substring(0, 31); // Limit to 31 characters
      
      // Ensure sheet name is unique
      const existingSheetNames = XLSX.utils.book_get_ws_names(workbook);
      let counter = 1;
      let originalSheetName = sheetName;
      while (existingSheetNames.includes(sheetName)) {
        sheetName = `${originalSheetName.substring(0, 28)}_${counter}`;
        counter++;
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      totalSheetsCreated++;
      console.log(`✅ Added worksheet for category: ${sheetName} with ${categoryItems.length} items`);
    }

    // Check if we created any sheets
    if (totalSheetsCreated === 0) {
      console.warn('⚠️ No sheets were created');
      Alert.alert(
        '⚠️ No Data',
        'No data was found to export. Please add some inventory items first.',
        [{ text: 'OK' }]
      );
      return false;
    }

    console.log(`📊 Excel workbook created with ${totalSheetsCreated} worksheets`);

    // Generate Excel file
    let excelBuffer: string;
    try {
      excelBuffer = XLSX.write(workbook, { 
        type: 'base64', 
        bookType: 'xlsx' 
      });
      console.log('✅ Excel buffer generated successfully, size:', excelBuffer.length, 'characters');
    } catch (xlsxError) {
      console.error('❌ XLSX write error:', xlsxError);
      throw new Error(`Failed to generate Excel file: ${xlsxError instanceof Error ? xlsxError.message : 'Unknown XLSX error'}`);
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventory_all_categories_${timestamp}.xlsx`;

    console.log('💾 Generated Excel file:', filename);

    if (Platform.OS === 'web') {
      // For web, create a download link
      try {
        console.log('🌐 Starting web download process...');
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
        
        Alert.alert(
          '✅ Export Complete',
          `File downloaded as ${filename} with ${totalSheetsCreated} tabs (1 summary + ${totalSheetsCreated - 1} category tabs)`,
          [{ text: 'OK' }]
        );
        console.log('✅ Web export completed successfully');
        return true;
      } catch (webError) {
        console.error('❌ Web export error:', webError);
        throw new Error(`Web export failed: ${webError instanceof Error ? webError.message : 'Unknown web error'}`);
      }
    } else {
      // For mobile devices - use FileSystem API
      try {
        console.log('📱 Starting mobile export process...');
        // Get the cache directory - use FileSystemLegacy for compatibility
        const cacheDirectory = FileSystemLegacy.cacheDirectory;
        if (!cacheDirectory) {
          throw new Error('Cache directory is not available');
        }
        const fileUri = cacheDirectory + filename;
        
        // Write base64 data to file using FileSystemLegacy
        await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        console.log('📱 Excel file saved to:', fileUri);

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('📤 Sharing available:', isAvailable);

        if (isAvailable) {
          console.log('🔄 Opening share dialog...');
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export All Inventory Categories to Excel',
          });
          console.log('✅ Share dialog completed');
        } else {
          Alert.alert(
            '✅ Export Complete',
            `File saved as ${filename} with ${totalSheetsCreated} tabs (1 summary + ${totalSheetsCreated - 1} category tabs).\n\nFile location: ${fileUri}`,
            [{ text: 'OK' }]
          );
        }
        return true;
      } catch (mobileError) {
        console.error('❌ Mobile export error:', mobileError);
        throw new Error(`Mobile export failed: ${mobileError instanceof Error ? mobileError.message : 'Unknown mobile error'}`);
      }
    }
  } catch (error) {
    console.error('❌ Excel export error:', error);
    Alert.alert(
      '❌ Export Failed',
      `There was an error exporting your inventory: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your device storage.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const exportCategoryToExcel = async (categoryName: string, itemNumbers: ItemNumberEntry[]) => {
  try {
    console.log(`🚀 Starting Excel export for ${categoryName} with`, itemNumbers.length, 'item numbers');

    if (!itemNumbers || itemNumbers.length === 0) {
      console.warn('⚠️ No data to export for category:', categoryName);
      Alert.alert(
        '⚠️ No Data',
        `There are no items in the ${categoryName} category to export.`,
        [{ text: 'OK' }]
      );
      return false;
    }

    // Show initial feedback
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Export Starting',
        `Creating Excel file for ${categoryName}... This may take a moment.`,
        [{ text: 'OK' }]
      );
    }

    // Prepare data for Excel
    const excelData = itemNumbers.map((item, index) => ({
      '#': index + 1,
      'Product Name': item.productName || '',
      'Item Number': item.itemNumber || '',
      'Floor Count': item.floorCount || 0,
      'Storage Count': item.storageCount || 0,
      'Total Count': item.totalCount || 0,
    }));

    // Add summary row
    const totalFloor = itemNumbers.reduce((sum, item) => sum + (item.floorCount || 0), 0);
    const totalStorage = itemNumbers.reduce((sum, item) => sum + (item.storageCount || 0), 0);
    const grandTotal = itemNumbers.reduce((sum, item) => sum + (item.totalCount || 0), 0);
    
    excelData.push({
      '#': '',
      'Product Name': '',
      'Item Number': 'TOTALS',
      'Floor Count': totalFloor,
      'Storage Count': totalStorage,
      'Total Count': grandTotal,
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // #
      { wch: 25 }, // Product Name
      { wch: 20 }, // Item Number
      { wch: 12 }, // Floor Count
      { wch: 15 }, // Storage Count
      { wch: 12 }, // Total Count
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, categoryName);

    console.log('📊 Excel workbook created for category:', categoryName);

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'base64', 
      bookType: 'xlsx' 
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${categoryName.toLowerCase().replace(/\s+/g, '_')}_export_${timestamp}.xlsx`;

    console.log('💾 Generated Excel file:', filename);

    if (Platform.OS === 'web') {
      // For web, create a download link
      try {
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
        
        Alert.alert(
          '✅ Export Complete',
          `File downloaded as ${filename}`,
          [{ text: 'OK' }]
        );
        console.log('✅ Web category export completed successfully');
        return true;
      } catch (webError) {
        console.error('❌ Web category export error:', webError);
        throw webError;
      }
    } else {
      // For mobile devices - use FileSystem API
      try {
        // Get the cache directory - use FileSystemLegacy for compatibility
        const cacheDirectory = FileSystemLegacy.cacheDirectory;
        if (!cacheDirectory) {
          throw new Error('Cache directory is not available');
        }
        const fileUri = cacheDirectory + filename;
        
        // Write base64 data to file using FileSystemLegacy
        await FileSystemLegacy.writeAsStringAsync(fileUri, excelBuffer, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        console.log('📱 Excel file saved to:', fileUri);

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('📤 Sharing available:', isAvailable);

        if (isAvailable) {
          console.log('🔄 Opening share dialog...');
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Export ${categoryName} to Excel`,
          });
          console.log('✅ Share dialog completed');
        } else {
          Alert.alert(
            '✅ Export Complete',
            `File saved as ${filename} in your cache folder.\n\nFile location: ${fileUri}`,
            [{ text: 'OK' }]
          );
        }
        return true;
      } catch (mobileError) {
        console.error('❌ Mobile category export error:', mobileError);
        throw mobileError;
      }
    }
  } catch (error) {
    console.error('❌ Excel export error:', error);
    Alert.alert(
      '❌ Export Failed',
      `There was an error exporting ${categoryName}: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your device storage.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

// Test function to verify export functionality
export const testExportFunctionality = async () => {
  try {
    console.log('🧪 Testing Excel export functionality...');
    
    // Create test data
    const testItemNumbers: ItemNumberEntry[] = [
      {
        id: 'test-1',
        itemNumber: 'TEST-001',
        productName: 'Test Product 1',
        floorCount: 5,
        storageCount: 10,
        totalCount: 15,
        category: 'oils' as any,
      },
      {
        id: 'test-2',
        itemNumber: 'TEST-002',
        productName: 'Test Product 2',
        floorCount: 3,
        storageCount: 7,
        totalCount: 10,
        category: 'oils' as any,
      }
    ];

    console.log('🧪 Running test with', testItemNumbers.length, 'test items');

    // Test category export
    const result = await exportCategoryToExcel('Test Category', testItemNumbers);
    
    if (result) {
      Alert.alert(
        '✅ Test Successful',
        'Excel export functionality is working! You can now export your real inventory data.',
        [{ text: 'Great!' }]
      );
      console.log('✅ Test export completed successfully');
    } else {
      console.warn('⚠️ Test export returned false');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    Alert.alert(
      '❌ Test Failed',
      `Export test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis might indicate a problem with the export functionality.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};
