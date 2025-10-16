
import { useInventory } from '@/contexts/InventoryContext';
import { colors } from '@/styles/commonStyles';
import React, { useEffect } from 'react';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { Stack, Link } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, View, Text, Platform } from 'react-native';
import { fetchAllItemNumbers, fetchAllCategories } from '@/services/supabaseHelpers';

export default function HomeScreen() {
  const theme = useTheme();
  const { categories, getAllItemNumbers, forceRefresh } = useInventory();

  useEffect(() => {
    // Sync with Supabase on app start
    const syncWithSupabase = async () => {
      try {
        console.log('🔄 Syncing with Supabase on home screen load...');
        
        // Fetch latest data from Supabase
        await fetchAllItemNumbers();
        await fetchAllCategories();
        
        // Force refresh to update UI
        forceRefresh();
      } catch (error) {
        console.error('❌ Error syncing with Supabase:', error);
      }
    };

    syncWithSupabase();
  }, []);

  const getRouteForCategory = (categoryId: string) => {
    const routeMap: { [key: string]: string } = {
      'oils': '/oils',
      'oil-filters': '/oil-filters',
      'air-filters': '/air-filters',
      'cabin-filters': '/cabin-filters',
      'wipers': '/wipers',
      'misc': '/misc',
    };
    return routeMap[categoryId] || '/misc';
  };

  const renderCategoryCard = (category: any, index: number) => {
    const allItemNumbers = getAllItemNumbers();
    const categoryItems = allItemNumbers.filter(item => item.category === category.id);
    const totalCount = categoryItems.reduce((sum, item) => sum + item.totalCount, 0);

    return (
      <Link key={category.id} href={getRouteForCategory(category.id)} asChild>
        <Pressable>
          <GlassView
            style={[
              styles.categoryCard,
              Platform.OS !== 'ios' && { backgroundColor: colors.card }
            ]}
            glassEffectStyle="regular"
          >
            <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
              <IconSymbol name={category.icon} size={24} color="white" />
            </View>
            <View style={styles.categoryContent}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.categoryStats, { color: colors.textSecondary }]}>
                {categoryItems.length} items • {totalCount} total
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
          </GlassView>
        </Pressable>
      </Link>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inventory Counter',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => <SyncStatusIndicator />,
        }}
      />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select a category to manage your inventory
            </Text>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => renderCategoryCard(category, index))}
          </View>

          <View style={styles.quickActions}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            
            <Link href="/export" asChild>
              <Pressable>
                <GlassView
                  style={[
                    styles.actionCard,
                    Platform.OS !== 'ios' && { backgroundColor: colors.card }
                  ]}
                  glassEffectStyle="regular"
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="square.and.arrow.up" size={18} color="white" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                      Import & Export
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                      Upload Excel files or export data
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </GlassView>
              </Pressable>
            </Link>

            <Link href="/category-management" asChild>
              <Pressable>
                <GlassView
                  style={[
                    styles.actionCard,
                    Platform.OS !== 'ios' && { backgroundColor: colors.card }
                  ]}
                  glassEffectStyle="regular"
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
                    <IconSymbol name="square.grid.2x2" size={18} color="white" />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                      Manage Categories
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                      Add, edit, or remove categories
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </GlassView>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </View>
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
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  categoriesGrid: {
    gap: 10,
    marginBottom: 28,
  },
  categoryCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStats: {
    fontSize: 12,
  },
  quickActions: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  actionCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
  },
});
