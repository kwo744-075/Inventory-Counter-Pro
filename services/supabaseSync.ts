
import { supabase } from './supabase';
import { ItemNumberEntry, CategoryManagement } from '@/types/inventory';

/**
 * Fetch all item numbers from Supabase
 */
export const fetchItemNumbersFromSupabase = async (): Promise<ItemNumberEntry[]> => {
  try {
    console.log('📥 Fetching item numbers from Supabase...');
    const { data, error } = await supabase
      .from('item_numbers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching item numbers:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} item numbers from Supabase`);

    // Transform Supabase data to local format
    const itemNumbers: ItemNumberEntry[] = (data || []).map(item => ({
      id: item.id,
      itemNumber: item.item_number,
      productName: item.product_name,
      floorCount: item.floor_count || 0,
      storageCount: item.storage_count || 0,
      totalCount: item.total_count || (item.floor_count + item.storage_count),
      category: item.category,
    }));

    return itemNumbers;
  } catch (error) {
    console.error('❌ Error in fetchItemNumbersFromSupabase:', error);
    return [];
  }
};

/**
 * Fetch all categories from Supabase
 */
export const fetchCategoriesFromSupabase = async (): Promise<CategoryManagement[]> => {
  try {
    console.log('📥 Fetching categories from Supabase...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} categories from Supabase`);

    // Transform Supabase data to local format
    const categories: CategoryManagement[] = (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isLocked: cat.is_locked || false,
      isCustom: cat.is_custom || false,
      createdAt: new Date(cat.created_at),
      updatedAt: new Date(cat.updated_at),
    }));

    return categories;
  } catch (error) {
    console.error('❌ Error in fetchCategoriesFromSupabase:', error);
    return [];
  }
};

/**
 * Sync item number to Supabase
 */
export const syncItemNumberToSupabase = async (itemNumber: ItemNumberEntry): Promise<boolean> => {
  try {
    console.log('💾 Syncing item number to Supabase:', itemNumber.itemNumber);
    
    const { error } = await supabase
      .from('item_numbers')
      .upsert({
        id: itemNumber.id,
        item_number: itemNumber.itemNumber,
        product_name: itemNumber.productName,
        floor_count: itemNumber.floorCount,
        storage_count: itemNumber.storageCount,
        category: itemNumber.category,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('❌ Error syncing item number:', error);
      return false;
    }

    console.log('✅ Successfully synced item number to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error in syncItemNumberToSupabase:', error);
    return false;
  }
};

/**
 * Delete item number from Supabase
 */
export const deleteItemNumberFromSupabase = async (id: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting item number from Supabase:', id);
    
    const { error } = await supabase
      .from('item_numbers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting item number:', error);
      return false;
    }

    console.log('✅ Successfully deleted item number from Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteItemNumberFromSupabase:', error);
    return false;
  }
};

/**
 * Sync category to Supabase
 */
export const syncCategoryToSupabase = async (category: CategoryManagement): Promise<boolean> => {
  try {
    console.log('💾 Syncing category to Supabase:', category.name);
    
    const { error } = await supabase
      .from('categories')
      .upsert({
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        is_locked: category.isLocked,
        is_custom: category.isCustom,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('❌ Error syncing category:', error);
      return false;
    }

    console.log('✅ Successfully synced category to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error in syncCategoryToSupabase:', error);
    return false;
  }
};

/**
 * Delete category from Supabase
 */
export const deleteCategoryFromSupabase = async (id: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting category from Supabase:', id);
    
    // First delete all item numbers in this category
    await supabase
      .from('item_numbers')
      .delete()
      .eq('category', id);
    
    // Then delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting category:', error);
      return false;
    }

    console.log('✅ Successfully deleted category from Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteCategoryFromSupabase:', error);
    return false;
  }
};

/**
 * Initialize Supabase with default categories if empty
 */
export const initializeSupabaseCategories = async (defaultCategories: CategoryManagement[]): Promise<void> => {
  try {
    console.log('🔧 Checking if Supabase categories need initialization...');
    
    const { data: existingCategories, error } = await supabase
      .from('categories')
      .select('id');

    if (error) {
      console.error('❌ Error checking categories:', error);
      return;
    }

    if (!existingCategories || existingCategories.length === 0) {
      console.log('📝 Initializing Supabase with default categories...');
      
      const categoriesToInsert = defaultCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_locked: cat.isLocked,
        is_custom: cat.isCustom,
        created_at: cat.createdAt.toISOString(),
        updated_at: cat.updatedAt.toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (insertError) {
        console.error('❌ Error initializing categories:', insertError);
      } else {
        console.log('✅ Successfully initialized Supabase categories');
      }
    } else {
      console.log('✅ Supabase categories already initialized');
    }
  } catch (error) {
    console.error('❌ Error in initializeSupabaseCategories:', error);
  }
};
