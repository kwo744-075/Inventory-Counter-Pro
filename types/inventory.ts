
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  category: InventoryCategory;
  createdAt: Date;
  updatedAt: Date;
  itemNumber?: string;
  floorCount?: number;
  storageCount?: number;
}

export interface ItemNumberEntry {
  id: string;
  itemNumber: string;
  productName?: string;
  floorCount: number;
  storageCount: number;
  totalCount: number;
  category: InventoryCategory;
}

export type InventoryCategory = 'oils' | 'oil-filters' | 'air-filters' | 'cabin-filters' | 'wipers' | 'misc';

export interface CategoryInfo {
  id: InventoryCategory;
  title: string;
  icon: string;
  color: string;
  route: string;
  isLocked?: boolean;
  isCustom?: boolean;
}

export interface CategoryManagement {
  id: string;
  name: string;
  icon: string;
  color: string;
  isLocked: boolean;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CSVUploadResult {
  success: boolean;
  message: string;
  processedCount: number;
  errorCount: number;
  errors?: string[];
}

export type ExcelUploadResult = CSVUploadResult;

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncMessage: string;
}
