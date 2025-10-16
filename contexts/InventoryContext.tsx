
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem, InventoryCategory, ItemNumberEntry, CategoryManagement, CSVUploadResult } from '@/types/inventory';

interface InventoryContextType {
  items: InventoryItem[];
  itemNumbers: ItemNumberEntry[];
  categories: CategoryManagement[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  getItemsByCategory: (category: InventoryCategory) => InventoryItem[];
  getAllItems: () => InventoryItem[];
  // Item number methods
  addItemNumber: (itemNumber: Omit<ItemNumberEntry, 'id'>) => void;
  updateItemNumber: (id: string, updates: Partial<ItemNumberEntry>) => void;
  deleteItemNumber: (id: string) => void;
  getItemNumbersByCategory: (category: InventoryCategory) => ItemNumberEntry[];
  getAllItemNumbers: () => ItemNumberEntry[];
  // Category management methods
  addCategory: (category: Omit<CategoryManagement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, updates: Partial<CategoryManagement>) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryLock: (id: string) => void;
  // CSV/Excel upload method
  uploadCSV: (csvData: string) => Promise<CSVUploadResult>;
  // Reset methods - now return promises
  resetFloorCounts: () => Promise<void>;
  resetStorageCounts: () => Promise<void>;
  resetItemNumbers: () => Promise<void>;
  // Auto-save status
  isAutoSaving: boolean;
  lastSaved: Date | null;
  // Force refresh method
  forceRefresh: () => void;
  // Export tracking methods
  markExportSnapshot: () => Promise<void>;
  getAdjustedItems: () => ItemNumberEntry[];
  lastExportDate: Date | null;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

// Storage keys
const STORAGE_KEYS = {
  ITEMS: '@inventory_items',
  ITEM_NUMBERS: '@inventory_item_numbers',
  CATEGORIES: '@inventory_categories',
  LAST_SAVED: '@inventory_last_saved',
  EXPORT_SNAPSHOT: '@inventory_export_snapshot',
  LAST_EXPORT_DATE: '@inventory_last_export_date',
};

// Default categories
const DEFAULT_CATEGORIES: CategoryManagement[] = [
  {
    id: 'oils',
    name: 'Oils',
    icon: 'drop.fill',
    color: '#007AFF',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'oil-filters',
    name: 'Oil Filters',
    icon: 'circle.hexagongrid.fill',
    color: '#FF9500',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'air-filters',
    name: 'Air Filters',
    icon: 'wind',
    color: '#5856D6',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cabin-filters',
    name: 'Cabin Filters',
    icon: 'car.fill',
    color: '#34C759',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wipers',
    name: 'Wipers',
    icon: 'drop.triangle.fill',
    color: '#FF3B30',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: 'ellipsis.circle.fill',
    color: '#8E8E93',
    isLocked: true,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemNumbers, setItemNumbers] = useState<ItemNumberEntry[]>([]);
  const [categories, setCategories] = useState<CategoryManagement[]>(DEFAULT_CATEGORIES);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exportSnapshot, setExportSnapshot] = useState<ItemNumberEntry[]>([]);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);

  // Force refresh method to trigger re-renders
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Manual save function that bypasses auto-save
  const manualSave = useCallback(async (itemsToSave: InventoryItem[], itemNumbersToSave: ItemNumberEntry[], categoriesToSave: CategoryManagement[]) => {
    try {
      console.log('💾 Manual save starting...');
      setIsAutoSaving(true);
      const currentTime = new Date();
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ITEMS, JSON.stringify(itemsToSave)],
        [STORAGE_KEYS.ITEM_NUMBERS, JSON.stringify(itemNumbersToSave)],
        [STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesToSave)],
        [STORAGE_KEYS.LAST_SAVED, currentTime.toISOString()],
      ]);

      setLastSaved(currentTime);
      console.log('✅ Manual save completed at:', currentTime.toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error in manual save:', error);
      throw error;
    } finally {
      setIsAutoSaving(false);
    }
  }, []);

  // Auto-save function - memoized with useCallback to prevent unnecessary re-renders
  const autoSave = useCallback(async (itemsToSave?: InventoryItem[], itemNumbersToSave?: ItemNumberEntry[], categoriesToSave?: CategoryManagement[]) => {
    try {
      setIsAutoSaving(true);
      const currentTime = new Date();
      
      const dataToSave = {
        items: itemsToSave || items,
        itemNumbers: itemNumbersToSave || itemNumbers,
        categories: categoriesToSave || categories,
        lastSaved: currentTime.toISOString(),
      };

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ITEMS, JSON.stringify(dataToSave.items)],
        [STORAGE_KEYS.ITEM_NUMBERS, JSON.stringify(dataToSave.itemNumbers)],
        [STORAGE_KEYS.CATEGORIES, JSON.stringify(dataToSave.categories)],
        [STORAGE_KEYS.LAST_SAVED, dataToSave.lastSaved],
      ]);

      setLastSaved(currentTime);
      console.log('Auto-saved inventory data at:', currentTime.toLocaleTimeString());
    } catch (error) {
      console.error('Error auto-saving data:', error);
      throw error; // Re-throw to allow callers to handle the error
    } finally {
      setIsAutoSaving(false);
    }
  }, [items, itemNumbers, categories]);

  // Export tracking methods
  const markExportSnapshot = async (): Promise<void> => {
    try {
      console.log('📸 Creating export snapshot...');
      const currentTime = new Date();
      const snapshot = JSON.parse(JSON.stringify(itemNumbers)); // Deep copy
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.EXPORT_SNAPSHOT, JSON.stringify(snapshot)],
        [STORAGE_KEYS.LAST_EXPORT_DATE, currentTime.toISOString()],
      ]);
      
      setExportSnapshot(snapshot);
      setLastExportDate(currentTime);
      
      console.log('✅ Export snapshot created with', snapshot.length, 'items at', currentTime.toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error creating export snapshot:', error);
    }
  };

  const getAdjustedItems = (): ItemNumberEntry[] => {
    if (exportSnapshot.length === 0) {
      console.log('📊 No export snapshot available, all items considered new');
      return itemNumbers; // If no snapshot, all items are "adjusted"
    }

    const adjustedItems: ItemNumberEntry[] = [];
    
    itemNumbers.forEach(currentItem => {
      const snapshotItem = exportSnapshot.find(snap => snap.itemNumber === currentItem.itemNumber);
      
      if (!snapshotItem) {
        // New item since last export
        adjustedItems.push(currentItem);
        console.log('🆕 New item since last export:', currentItem.itemNumber);
      } else {
        // Check if counts have changed
        const floorChanged = currentItem.floorCount !== snapshotItem.floorCount;
        const storageChanged = currentItem.storageCount !== snapshotItem.storageCount;
        const nameChanged = currentItem.productName !== snapshotItem.productName;
        
        if (floorChanged || storageChanged || nameChanged) {
          adjustedItems.push(currentItem);
          console.log('🔄 Adjusted item since last export:', currentItem.itemNumber, {
            floorChanged,
            storageChanged,
            nameChanged
          });
        }
      }
    });
    
    console.log('📊 Found', adjustedItems.length, 'adjusted items out of', itemNumbers.length, 'total items');
    return adjustedItems;
  };

  // Load data from storage on app start
  const loadData = async () => {
    try {
      const [storedItems, storedItemNumbers, storedCategories, storedLastSaved, storedExportSnapshot, storedLastExportDate] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ITEMS,
        STORAGE_KEYS.ITEM_NUMBERS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.LAST_SAVED,
        STORAGE_KEYS.EXPORT_SNAPSHOT,
        STORAGE_KEYS.LAST_EXPORT_DATE,
      ]);

      if (storedItems[1]) {
        const parsedItems = JSON.parse(storedItems[1]);
        // Convert date strings back to Date objects
        const itemsWithDates = parsedItems.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
        setItems(itemsWithDates);
        console.log('Loaded', itemsWithDates.length, 'items from storage');
      } else {
        // Initialize with sample data if no stored data exists
        const sampleItems: InventoryItem[] = [
          {
            id: '1',
            name: '5W-30 Synthetic Motor Oil',
            quantity: 6,
            description: 'Full synthetic motor oil for modern engines',
            category: 'oils',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
          },
          {
            id: '2',
            name: 'K&N Oil Filter',
            quantity: 3,
            description: 'High-performance oil filter',
            category: 'oil-filters',
            createdAt: new Date('2024-01-16'),
            updatedAt: new Date('2024-01-16'),
          },
          {
            id: '3',
            name: 'Engine Air Filter',
            quantity: 2,
            description: 'OEM replacement air filter',
            category: 'air-filters',
            createdAt: new Date('2024-01-17'),
            updatedAt: new Date('2024-01-17'),
          },
          {
            id: '4',
            name: '22-inch Wiper Blades',
            quantity: 4,
            description: 'All-season wiper blades',
            category: 'wipers',
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-18'),
          },
        ];
        setItems(sampleItems);
      }

      if (storedItemNumbers[1]) {
        const parsedItemNumbers = JSON.parse(storedItemNumbers[1]);
        setItemNumbers(parsedItemNumbers);
        console.log('Loaded', parsedItemNumbers.length, 'item numbers from storage');
      } else {
        // Initialize with sample item numbers if no stored data exists
        const sampleItemNumbers: ItemNumberEntry[] = [
          {
            id: 'in1',
            itemNumber: 'OIL-001',
            productName: '5W-30 Synthetic Motor Oil',
            floorCount: 5,
            storageCount: 12,
            totalCount: 17,
            category: 'oils',
          },
          {
            id: 'in2',
            itemNumber: 'OIL-002',
            productName: '10W-40 Conventional Oil',
            floorCount: 3,
            storageCount: 8,
            totalCount: 11,
            category: 'oils',
          },
          {
            id: 'in3',
            itemNumber: 'OF-001',
            productName: 'K&N Oil Filter',
            floorCount: 2,
            storageCount: 15,
            totalCount: 17,
            category: 'oil-filters',
          },
        ];
        setItemNumbers(sampleItemNumbers);
      }

      if (storedCategories[1]) {
        const parsedCategories = JSON.parse(storedCategories[1]);
        const categoriesWithDates = parsedCategories.map((category: any) => ({
          ...category,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        }));
        
        // Ensure all categories have the isCustom property set correctly
        const categoriesWithCustomFlag = categoriesWithDates.map((category: any) => {
          // Check if this is a default category
          const isDefaultCategory = DEFAULT_CATEGORIES.some(defaultCat => defaultCat.id === category.id);
          
          return {
            ...category,
            isCustom: !isDefaultCategory, // If it's not a default category, it's custom
          };
        });
        
        setCategories(categoriesWithCustomFlag);
        console.log('Loaded', categoriesWithCustomFlag.length, 'categories from storage');
        console.log('Categories with custom flags:', categoriesWithCustomFlag.map(cat => ({
          name: cat.name,
          id: cat.id,
          isCustom: cat.isCustom
        })));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (storedLastSaved[1]) {
        setLastSaved(new Date(storedLastSaved[1]));
      }

      // Load export tracking data
      if (storedExportSnapshot[1]) {
        const parsedSnapshot = JSON.parse(storedExportSnapshot[1]);
        setExportSnapshot(parsedSnapshot);
        console.log('Loaded export snapshot with', parsedSnapshot.length, 'items');
      }

      if (storedLastExportDate[1]) {
        setLastExportDate(new Date(storedLastExportDate[1]));
        console.log('Loaded last export date:', new Date(storedLastExportDate[1]).toLocaleString());
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-save whenever items, itemNumbers, or categories change
  useEffect(() => {
    if (items.length > 0 || itemNumbers.length > 0 || categories.length > 0) {
      autoSave();
    }
  }, [items, itemNumbers, categories, autoSave]);

  const addItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    console.log('Added item:', newItem);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    const updatedItems = items.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date() }
        : item
    );
    setItems(updatedItems);
    console.log('Updated item:', id, updates);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    console.log('Deleted item:', id);
  };

  const getItemsByCategory = (category: InventoryCategory) => {
    return items.filter(item => item.category === category);
  };

  const getAllItems = () => {
    return items;
  };

  // Item number methods
  const addItemNumber = (itemNumberData: Omit<ItemNumberEntry, 'id'>) => {
    const newItemNumber: ItemNumberEntry = {
      ...itemNumberData,
      id: 'in_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const updatedItemNumbers = [...itemNumbers, newItemNumber];
    setItemNumbers(updatedItemNumbers);
    console.log('✅ Added item number:', newItemNumber);
    return newItemNumber; // Return the new item for immediate use
  };

  const updateItemNumber = (id: string, updates: Partial<ItemNumberEntry>) => {
    console.log('🔄 Updating item number:', id, updates);
    const updatedItemNumbers = itemNumbers.map(itemNumber => 
      itemNumber.id === id 
        ? { ...itemNumber, ...updates }
        : itemNumber
    );
    setItemNumbers(updatedItemNumbers);
    console.log('✅ Updated item number:', id, updates);
  };

  const deleteItemNumber = async (id: string) => {
    console.log('🗑️ FIXED DELETE - Starting deletion for item:', id);
    
    const itemToDelete = itemNumbers.find(item => item.id === id);
    if (!itemToDelete) {
      console.warn('❌ Item not found for deletion:', id);
      return;
    }
    
    console.log('🗑️ Found item to delete:', itemToDelete.itemNumber, itemToDelete.productName);
    
    // Create new array without the deleted item
    const updatedItemNumbers = itemNumbers.filter(itemNumber => itemNumber.id !== id);
    console.log('📊 Items before deletion:', itemNumbers.length);
    console.log('📊 Items after deletion:', updatedItemNumbers.length);
    
    // Update state immediately
    setItemNumbers(updatedItemNumbers);
    
    try {
      // Save to AsyncStorage immediately
      const currentTime = new Date();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ITEM_NUMBERS, JSON.stringify(updatedItemNumbers)],
        [STORAGE_KEYS.LAST_SAVED, currentTime.toISOString()],
      ]);
      
      setLastSaved(currentTime);
      console.log('✅ Successfully deleted item and saved to storage:', id);
      
      // Force refresh to ensure UI updates
      forceRefresh();
      
    } catch (error) {
      console.error('❌ Error saving after deletion:', error);
      // Revert state if save failed
      setItemNumbers(itemNumbers);
      throw error;
    }
  };

  const getItemNumbersByCategory = (category: InventoryCategory) => {
    return itemNumbers.filter(itemNumber => itemNumber.category === category);
  };

  const getAllItemNumbers = () => {
    return itemNumbers;
  };

  // Category management methods
  const addCategory = (categoryData: Omit<CategoryManagement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: CategoryManagement = {
      ...categoryData,
      id: 'cat_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    console.log('Added category:', newCategory);
  };

  const updateCategory = (id: string, updates: Partial<CategoryManagement>) => {
    const updatedCategories = categories.map(category => 
      category.id === id 
        ? { ...category, ...updates, updatedAt: new Date() }
        : category
    );
    setCategories(updatedCategories);
    console.log('Updated category:', id, updates);
  };

  const deleteCategory = async (id: string) => {
    console.log('🗑️ FIXED DELETE CATEGORY - Starting deletion process for ID:', id);
    
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (!categoryToDelete) {
      console.warn('❌ Category not found with ID:', id);
      console.log('📊 Available categories:', categories.map(cat => ({ id: cat.id, name: cat.name, isCustom: cat.isCustom })));
      return;
    }
    
    console.log('🗑️ Found category to delete:', {
      id: categoryToDelete.id,
      name: categoryToDelete.name,
      isLocked: categoryToDelete.isLocked,
      isCustom: categoryToDelete.isCustom
    });
    
    // Only allow deletion of custom categories
    if (!categoryToDelete.isCustom) {
      console.warn('❌ Cannot delete non-custom category:', categoryToDelete.name);
      console.log('📊 Category details:', categoryToDelete);
      return;
    }
    
    console.log('✅ Category is custom, proceeding with deletion:', categoryToDelete.name);
    
    // Remove the category from the list
    const updatedCategories = categories.filter(category => category.id !== id);
    console.log('📊 Categories before deletion:', categories.length);
    console.log('📊 Categories after deletion:', updatedCategories.length);
    
    // Also remove all items and item numbers in this category
    const updatedItems = items.filter(item => item.category !== id);
    const updatedItemNumbers = itemNumbers.filter(itemNumber => itemNumber.category !== id);
    
    console.log('📊 Items removed:', items.length - updatedItems.length);
    console.log('📊 Item numbers removed:', itemNumbers.length - updatedItemNumbers.length);
    
    // Update all states immediately
    setCategories(updatedCategories);
    setItems(updatedItems);
    setItemNumbers(updatedItemNumbers);
    
    try {
      // Save to AsyncStorage immediately
      const currentTime = new Date();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories)],
        [STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems)],
        [STORAGE_KEYS.ITEM_NUMBERS, JSON.stringify(updatedItemNumbers)],
        [STORAGE_KEYS.LAST_SAVED, currentTime.toISOString()],
      ]);
      
      setLastSaved(currentTime);
      console.log('✅ Successfully deleted category and associated data:', categoryToDelete.name);
      
      // Force a refresh to ensure UI updates
      forceRefresh();
      
    } catch (error) {
      console.error('❌ Error saving after category deletion:', error);
      // Revert states if save failed
      setCategories(categories);
      setItems(items);
      setItemNumbers(itemNumbers);
      throw error;
    }
  };

  const toggleCategoryLock = (id: string) => {
    const updatedCategories = categories.map(category => 
      category.id === id 
        ? { ...category, isLocked: !category.isLocked, updatedAt: new Date() }
        : category
    );
    setCategories(updatedCategories);
    console.log('Toggled lock for category:', id);
  };

  // FIXED CSV/Excel upload method with exact default column header matching
  const uploadCSV = async (csvData: string): Promise<CSVUploadResult> => {
    try {
      console.log('🔄 FIXED EXCEL IMPORT - Starting Excel import with exact default column header matching...');
      console.log('📊 Available categories:', categories.map(cat => `${cat.name} (${cat.id})`));
      console.log('📊 Current item count before import:', itemNumbers.length);
      
      if (!csvData || csvData.trim().length === 0) {
        console.error('❌ CSV data is empty or null');
        return {
          success: false,
          message: 'File is empty or could not be read',
          processedCount: 0,
          errorCount: 1,
          errors: ['File contains no data or could not be read']
        };
      }
      
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return {
          success: false,
          message: 'File is empty',
          processedCount: 0,
          errorCount: 1,
          errors: ['File contains no data']
        };
      }

      console.log('📋 Total lines in file:', lines.length);
      console.log('📋 First line (headers):', lines[0]);

      // Parse headers - exact matching for default column headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      console.log('📋 Parsed headers (exact):', headers);
      
      // FIXED: Exact matching for the default import column headers
      const DEFAULT_HEADERS = {
        PRODUCT_NAME: 'ProductName',
        ITEM_NUMBER: 'itemNumber', 
        FLOOR_COUNT: 'FloorCount',
        STORAGE_COUNT: 'StorageCount',
        CATEGORY: 'Category'
      };
      
      console.log('🎯 Looking for exact default headers:', DEFAULT_HEADERS);
      
      // Find header indices with exact matching first, then fallback to flexible matching
      let productNameIndex = headers.findIndex(h => h === DEFAULT_HEADERS.PRODUCT_NAME);
      let itemNumberIndex = headers.findIndex(h => h === DEFAULT_HEADERS.ITEM_NUMBER);
      let floorCountIndex = headers.findIndex(h => h === DEFAULT_HEADERS.FLOOR_COUNT);
      let storageCountIndex = headers.findIndex(h => h === DEFAULT_HEADERS.STORAGE_COUNT);
      let categoryIndex = headers.findIndex(h => h === DEFAULT_HEADERS.CATEGORY);
      
      console.log('🎯 Exact header matches:', {
        ProductName: productNameIndex,
        itemNumber: itemNumberIndex,
        FloorCount: floorCountIndex,
        StorageCount: storageCountIndex,
        Category: categoryIndex
      });
      
      // If exact matches not found, try flexible matching
      if (productNameIndex === -1) {
        productNameIndex = headers.findIndex(h => 
          h.toLowerCase().includes('product') && h.toLowerCase().includes('name') || 
          h.toLowerCase().includes('productname') || 
          h.toLowerCase().includes('name') ||
          h.toLowerCase().includes('product_name') ||
          h.toLowerCase().includes('description')
        );
        if (productNameIndex !== -1) {
          console.log('🔄 Flexible match for ProductName:', headers[productNameIndex]);
        }
      }
      
      if (itemNumberIndex === -1) {
        itemNumberIndex = headers.findIndex(h => 
          h.toLowerCase().includes('item') && h.toLowerCase().includes('number') || 
          h.toLowerCase().includes('itemnumber') || 
          h.toLowerCase().includes('product') && h.toLowerCase().includes('code') ||
          h.toLowerCase().includes('productcode') ||
          h.toLowerCase().includes('sku') ||
          h.toLowerCase() === 'item' ||
          h.toLowerCase() === 'code' ||
          h.toLowerCase().includes('part') && h.toLowerCase().includes('number') ||
          h.toLowerCase().includes('partnumber')
        );
        if (itemNumberIndex !== -1) {
          console.log('🔄 Flexible match for itemNumber:', headers[itemNumberIndex]);
        }
      }
      
      if (floorCountIndex === -1) {
        floorCountIndex = headers.findIndex(h => 
          h.toLowerCase().includes('floor') || 
          h.toLowerCase().includes('floorcount') ||
          h.toLowerCase().includes('floor_count') ||
          h.toLowerCase().includes('floor count')
        );
        if (floorCountIndex !== -1) {
          console.log('🔄 Flexible match for FloorCount:', headers[floorCountIndex]);
        }
      }
      
      if (storageCountIndex === -1) {
        storageCountIndex = headers.findIndex(h => 
          h.toLowerCase().includes('storage') || 
          h.toLowerCase().includes('storagecount') ||
          h.toLowerCase().includes('storage_count') ||
          h.toLowerCase().includes('storage count') ||
          h.toLowerCase().includes('warehouse') ||
          h.toLowerCase().includes('stock')
        );
        if (storageCountIndex !== -1) {
          console.log('🔄 Flexible match for StorageCount:', headers[storageCountIndex]);
        }
      }
      
      if (categoryIndex === -1) {
        categoryIndex = headers.findIndex(h => 
          h.toLowerCase().includes('category') || 
          h.toLowerCase().includes('type') ||
          h.toLowerCase().includes('group') ||
          h.toLowerCase().includes('section')
        );
        if (categoryIndex !== -1) {
          console.log('🔄 Flexible match for Category:', headers[categoryIndex]);
        }
      }

      console.log('📋 Final header indices:', {
        productName: productNameIndex,
        itemNumber: itemNumberIndex,
        floorCount: floorCountIndex,
        storageCount: storageCountIndex,
        category: categoryIndex
      });

      // Validate required headers
      const missingHeaders = [];
      if (itemNumberIndex === -1) missingHeaders.push('itemNumber');
      if (floorCountIndex === -1) missingHeaders.push('FloorCount');
      if (storageCountIndex === -1) missingHeaders.push('StorageCount');
      if (categoryIndex === -1) missingHeaders.push('Category');
      
      if (missingHeaders.length > 0) {
        console.error('❌ Missing required headers:', missingHeaders);
        const expectedHeaders = `${DEFAULT_HEADERS.PRODUCT_NAME}, ${DEFAULT_HEADERS.ITEM_NUMBER}, ${DEFAULT_HEADERS.FLOOR_COUNT}, ${DEFAULT_HEADERS.STORAGE_COUNT}, ${DEFAULT_HEADERS.CATEGORY}`;
        return {
          success: false,
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
          processedCount: 0,
          errorCount: 1,
          errors: [
            `Missing columns: ${missingHeaders.join(', ')}.`,
            `Expected default headers: ${expectedHeaders}`,
            `Found headers: ${headers.join(', ')}`
          ]
        };
      }

      let processedCount = 0;
      let errorCount = 0;
      let newItemsCount = 0;
      let updatedItemsCount = 0;
      const errors: string[] = [];
      const processedItems: ItemNumberEntry[] = [];

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          // Split by comma and handle quoted values
          const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          
          console.log(`📋 Processing row ${i + 1}:`, values);
          
          if (values.length < Math.max(itemNumberIndex, floorCountIndex, storageCountIndex, categoryIndex, productNameIndex) + 1) {
            errors.push(`Row ${i + 1}: Insufficient columns (expected ${headers.length}, got ${values.length})`);
            errorCount++;
            continue;
          }

          const productName = productNameIndex !== -1 ? values[productNameIndex]?.trim() : '';
          const itemNumber = values[itemNumberIndex]?.trim();
          const floorCountStr = values[floorCountIndex]?.trim();
          const storageCountStr = values[storageCountIndex]?.trim();
          const categoryStr = values[categoryIndex]?.trim().toLowerCase();

          // Validate item number
          if (!itemNumber) {
            errors.push(`Row ${i + 1}: Missing item number`);
            errorCount++;
            continue;
          }

          // Parse counts
          const floorCount = parseInt(floorCountStr) || 0;
          const storageCount = parseInt(storageCountStr) || 0;

          // Enhanced automatic category matching
          let matchedCategory: string | null = null;
          
          console.log(`🔍 Attempting to match category: "${categoryStr}"`);
          
          // 1. Direct ID match (exact)
          const directMatch = categories.find(cat => cat.id.toLowerCase() === categoryStr);
          if (directMatch) {
            matchedCategory = directMatch.id;
            console.log(`✅ Direct ID match: "${categoryStr}" -> "${matchedCategory}"`);
          } else {
            // 2. Name-based matching (case insensitive, exact)
            const nameMatch = categories.find(cat => 
              cat.name.toLowerCase() === categoryStr
            );
            
            if (nameMatch) {
              matchedCategory = nameMatch.id;
              console.log(`✅ Name match: "${categoryStr}" -> "${matchedCategory}"`);
            } else {
              // 3. Flexible name matching (with space/dash variations)
              const flexibleNameMatch = categories.find(cat => {
                const catName = cat.name.toLowerCase();
                const catId = cat.id.toLowerCase();
                
                // Remove spaces, dashes, underscores for comparison
                const normalizedCatName = catName.replace(/[\s\-_]/g, '');
                const normalizedCatId = catId.replace(/[\s\-_]/g, '');
                const normalizedInput = categoryStr.replace(/[\s\-_]/g, '');
                
                return (
                  normalizedCatName === normalizedInput ||
                  normalizedCatId === normalizedInput ||
                  catName.replace(/\s+/g, '-') === categoryStr ||
                  catId.replace(/-/g, ' ') === categoryStr
                );
              });
              
              if (flexibleNameMatch) {
                matchedCategory = flexibleNameMatch.id;
                console.log(`✅ Flexible name match: "${categoryStr}" -> "${matchedCategory}"`);
              } else {
                // 4. Partial/contains matching
                const partialMatch = categories.find(cat => {
                  const catName = cat.name.toLowerCase();
                  const catId = cat.id.toLowerCase();
                  
                  return (
                    catName.includes(categoryStr) ||
                    categoryStr.includes(catName) ||
                    catId.includes(categoryStr) ||
                    categoryStr.includes(catId)
                  );
                });
                
                if (partialMatch) {
                  matchedCategory = partialMatch.id;
                  console.log(`✅ Partial match: "${categoryStr}" -> "${matchedCategory}"`);
                } else {
                  // 5. Smart matching for common variations
                  const smartMatch = categories.find(cat => {
                    const catName = cat.name.toLowerCase();
                    const catId = cat.id.toLowerCase();
                    
                    // Handle common variations
                    const variations = [
                      categoryStr.replace(/s$/, ''), // Remove plural 's'
                      categoryStr + 's', // Add plural 's'
                      categoryStr.replace(/filter/g, '').trim(), // Remove 'filter'
                      categoryStr.replace(/oil/g, '').trim(), // Remove 'oil'
                      categoryStr.replace(/air/g, '').trim(), // Remove 'air'
                      categoryStr.replace(/cabin/g, '').trim(), // Remove 'cabin'
                    ];
                    
                    return variations.some(variation => 
                      catName.includes(variation) || 
                      catId.includes(variation) ||
                      variation.includes(catName) ||
                      variation.includes(catId)
                    );
                  });
                  
                  if (smartMatch) {
                    matchedCategory = smartMatch.id;
                    console.log(`✅ Smart match: "${categoryStr}" -> "${matchedCategory}"`);
                  }
                }
              }
            }
          }

          if (!matchedCategory) {
            const availableCategories = categories.map(cat => `"${cat.name}" (${cat.id})`).join(', ');
            errors.push(`Row ${i + 1}: Could not match category "${categoryStr}" to any available category. Available: ${availableCategories}`);
            errorCount++;
            continue;
          }

          console.log(`✅ Row ${i + 1}: Successfully matched category "${categoryStr}" to "${matchedCategory}"`);

          // Create the item entry
          const newItemEntry: ItemNumberEntry = {
            id: 'import_' + Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
            itemNumber,
            productName: productName || undefined,
            floorCount,
            storageCount,
            totalCount: floorCount + storageCount,
            category: matchedCategory as InventoryCategory,
          };

          processedItems.push(newItemEntry);
          processedCount++;
          
          console.log(`✅ Processed item: ${itemNumber} (${productName}) -> category: ${matchedCategory}`);

        } catch (error) {
          const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          errorCount++;
          console.error('❌ Row processing error:', errorMsg);
        }
      }

      // ENHANCED: Apply immediate state updates with proper duplicate replacement and better tracking
      if (processedItems.length > 0) {
        console.log('🔄 ENHANCED: Applying immediate state updates with improved duplicate replacement...');
        
        // Get current state snapshot
        const currentItemNumbers = [...itemNumbers];
        let updatedItemNumbers = [...currentItemNumbers];
        
        processedItems.forEach(newItem => {
          // Find existing item by item number (case insensitive)
          const existingIndex = updatedItemNumbers.findIndex(item => 
            item.itemNumber.toLowerCase() === newItem.itemNumber.toLowerCase()
          );
          
          if (existingIndex !== -1) {
            // Replace existing item (automatic duplicate replacement)
            console.log(`🔄 Replacing duplicate: ${newItem.itemNumber} (was in ${updatedItemNumbers[existingIndex].category}, now in ${newItem.category})`);
            updatedItemNumbers[existingIndex] = newItem;
            updatedItemsCount++;
          } else {
            // Add new item (automatic categorization)
            console.log(`➕ Adding new item: ${newItem.itemNumber} to category ${newItem.category}`);
            updatedItemNumbers.push(newItem);
            newItemsCount++;
          }
        });
        
        console.log('📊 ENHANCED: Final item numbers count:', updatedItemNumbers.length);
        console.log('📊 ENHANCED: Items by category:', 
          categories.map(cat => ({
            category: cat.name,
            count: updatedItemNumbers.filter(item => item.category === cat.id).length
          }))
        );
        
        // ENHANCED: Update state immediately with multiple refresh triggers
        console.log('🔄 ENHANCED: Updating state immediately with multiple refresh triggers...');
        setItemNumbers(updatedItemNumbers);
        
        // ENHANCED: Immediate refresh
        forceRefresh();
        
        // ENHANCED: Staggered refreshes to ensure UI updates
        setTimeout(() => {
          console.log('🔄 ENHANCED: First delayed refresh after import');
          forceRefresh();
        }, 100);
        
        setTimeout(() => {
          console.log('🔄 ENHANCED: Second delayed refresh after import');
          forceRefresh();
        }, 300);
        
        setTimeout(() => {
          console.log('🔄 ENHANCED: Third delayed refresh after import');
          forceRefresh();
        }, 800);
        
        try {
          // Save to storage immediately
          const currentTime = new Date();
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.ITEM_NUMBERS, JSON.stringify(updatedItemNumbers)],
            [STORAGE_KEYS.LAST_SAVED, currentTime.toISOString()],
          ]);
          
          setLastSaved(currentTime);
          console.log('✅ ENHANCED: Successfully saved imported data to storage');
          
          // ENHANCED: Additional refresh after successful save
          setTimeout(() => {
            console.log('🔄 ENHANCED: Final refresh after successful save');
            forceRefresh();
          }, 1200);
          
        } catch (error) {
          console.error('❌ Error saving imported data:', error);
          // Revert state if save failed
          setItemNumbers(currentItemNumbers);
          throw new Error(`Failed to save imported data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // ENHANCED: Detailed result message with breakdown
      const resultMessage = processedCount > 0 
        ? `Successfully processed ${processedCount} items (${newItemsCount} new, ${updatedItemsCount} updated)${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
        : `No items were processed${errorCount > 0 ? ` (${errorCount} errors)` : ''}`;

      console.log('✅ ENHANCED: Import completed with improved state management:', {
        processedCount,
        newItemsCount,
        updatedItemsCount,
        errorCount,
        finalItemCount: itemNumbers.length + newItemsCount,
        categoriesUsed: [...new Set(processedItems.map(item => item.category))].length
      });

      return {
        success: processedCount > 0,
        message: resultMessage,
        processedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Enhanced Excel import error:', error);
      return {
        success: false,
        message: 'Failed to process file',
        processedCount: 0,
        errorCount: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  };

  // FIXED reset functions with proper state management and storage persistence
  const resetFloorCounts = async (): Promise<void> => {
    try {
      console.log('🔄 FIXED RESET FLOOR COUNTS - Starting operation...');
      console.log(`📊 Current item numbers count: ${itemNumbers.length}`);
      
      if (itemNumbers.length === 0) {
        console.log('⚠️ No item numbers to reset floor counts for');
        return;
      }
      
      // Create updated item numbers with floor counts reset to 0
      const updatedItemNumbers = itemNumbers.map(item => ({
        ...item,
        floorCount: 0,
        totalCount: 0 + item.storageCount, // Recalculate total with floor = 0
      }));
      
      console.log(`📊 Resetting floor counts for ${updatedItemNumbers.length} items`);
      
      // Update state immediately
      setItemNumbers(updatedItemNumbers);
      
      // Use manual save to bypass auto-save and ensure immediate persistence
      await manualSave(items, updatedItemNumbers, categories);
      
      console.log('✅ Successfully reset all floor counts to 0 and saved to storage');
      
      // Force refresh to ensure UI updates
      forceRefresh();
      
      // Additional delayed refresh to ensure UI synchronization
      setTimeout(() => {
        console.log('🔄 Delayed refresh after floor count reset');
        forceRefresh();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error resetting floor counts:', error);
      throw new Error(`Failed to reset floor counts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetStorageCounts = async (): Promise<void> => {
    try {
      console.log('🔄 FIXED RESET STORAGE COUNTS - Starting operation...');
      console.log(`📊 Current item numbers count: ${itemNumbers.length}`);
      
      if (itemNumbers.length === 0) {
        console.log('⚠️ No item numbers to reset storage counts for');
        return;
      }
      
      // Create updated item numbers with storage counts reset to 0
      const updatedItemNumbers = itemNumbers.map(item => ({
        ...item,
        storageCount: 0,
        totalCount: item.floorCount + 0, // Recalculate total with storage = 0
      }));
      
      console.log(`📊 Resetting storage counts for ${updatedItemNumbers.length} items`);
      
      // Update state immediately
      setItemNumbers(updatedItemNumbers);
      
      // Use manual save to bypass auto-save and ensure immediate persistence
      await manualSave(items, updatedItemNumbers, categories);
      
      console.log('✅ Successfully reset all storage counts to 0 and saved to storage');
      
      // Force refresh to ensure UI updates
      forceRefresh();
      
      // Additional delayed refresh to ensure UI synchronization
      setTimeout(() => {
        console.log('🔄 Delayed refresh after storage count reset');
        forceRefresh();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error resetting storage counts:', error);
      throw new Error(`Failed to reset storage counts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetItemNumbers = async (): Promise<void> => {
    try {
      console.log('🔄 FIXED RESET ITEM NUMBERS - Starting operation...');
      console.log(`📊 Deleting all ${itemNumbers.length} item numbers`);
      
      const emptyItemNumbers: ItemNumberEntry[] = [];
      
      // Update state immediately
      setItemNumbers(emptyItemNumbers);
      
      // Use manual save to bypass auto-save and ensure immediate persistence
      await manualSave(items, emptyItemNumbers, categories);
      
      console.log('✅ Successfully deleted all item numbers and saved to storage');
      
      // Force refresh to ensure UI updates
      forceRefresh();
      
      // Additional delayed refresh to ensure UI synchronization
      setTimeout(() => {
        console.log('🔄 Delayed refresh after item numbers reset');
        forceRefresh();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error resetting item numbers:', error);
      throw new Error(`Failed to reset item numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const value: InventoryContextType = {
    items,
    itemNumbers,
    categories,
    addItem,
    updateItem,
    deleteItem,
    getItemsByCategory,
    getAllItems,
    addItemNumber,
    updateItemNumber,
    deleteItemNumber,
    getItemNumbersByCategory,
    getAllItemNumbers,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryLock,
    uploadCSV,
    resetFloorCounts,
    resetStorageCounts,
    resetItemNumbers,
    isAutoSaving,
    lastSaved,
    forceRefresh,
    markExportSnapshot,
    getAdjustedItems,
    lastExportDate,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
