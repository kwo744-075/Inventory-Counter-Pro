
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";
import ResetControls from "@/components/ResetControls";
import TestDataGenerator from "@/components/TestDataGenerator";
import { useInventory } from "@/contexts/InventoryContext";
import { Link } from 'expo-router';
import { exportAllDataWithCategoryTabs } from "@/utils/excelExport";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const { getAllItemNumbers, categories, lastSaved, forceRefresh } = useInventory();
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force re-renders
  const { colors: themeColors } = useTheme();

  // Force refresh when reset operations complete
  const handleResetComplete = useCallback(() => {
    console.log('🔄 Reset operation completed, refreshing UI...');
    setRefreshKey(prev => prev + 1);
    forceRefresh(); // Use the context's force refresh method
  }, [forceRefresh]);

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSaved.toLocaleDateString();
  };

  const handleExportAllData = async () => {
    try {
      setIsExporting(true);
      console.log('🚀 Starting export all data from profile...');
      
      const allItemNumbers = getAllItemNumbers();
      
      console.log('📊 Profile Export Debug Info:');
      console.log('  - Total item numbers:', allItemNumbers.length);
      console.log('  - Total categories:', categories.length);
      console.log('  - Categories:', categories.map(cat => `${cat.name} (${cat.id})`));
      
      if (allItemNumbers.length === 0) {
        Alert.alert(
          'No Data',
          'There are no item numbers to export. Please add some inventory items first.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (categories.length === 0) {
        Alert.alert(
          'No Categories',
          'There are no categories available for export.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('🔄 Calling exportAllDataWithCategoryTabs from profile...');
      const result = await exportAllDataWithCategoryTabs(allItemNumbers, categories);
      console.log('✅ Profile export result:', result);
      
      if (!result) {
        console.error('❌ Export function returned false from profile');
        Alert.alert(
          'Export Failed',
          'The export operation did not complete successfully. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Profile export failed:', error);
      Alert.alert(
        'Export Failed',
        `There was an error exporting your data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderFeatureCard = (title: string, description: string, icon: string, route: string, color: string) => (
    <Link href={route as any} asChild key={title}>
      <Pressable style={styles.featureCardPressable}>
        <GlassView
          style={[
            styles.featureCard,
            Platform.OS !== 'ios' && { backgroundColor: colors.card }
          ]}
          glassEffectStyle="regular"
        >
          <View style={[styles.featureIcon, { backgroundColor: color }]}>
            <IconSymbol name={icon as any} color="white" size={24} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          </View>
          <IconSymbol name="chevron.right" color={colors.textSecondary} size={16} />
        </GlassView>
      </Pressable>
    </Link>
  );

  // Get current data for display (use refreshKey to force re-evaluation)
  const allItemNumbers = getAllItemNumbers();
  const totalItems = allItemNumbers.length;
  const totalCount = allItemNumbers.reduce((sum, item) => sum + item.totalCount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        key={refreshKey} // Force re-render when refreshKey changes
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Profile & Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your inventory and app settings
          </Text>
        </View>

        {/* Inventory Summary */}
        <GlassView
          style={[
            styles.summaryCard,
            Platform.OS !== 'ios' && { backgroundColor: colors.card }
          ]}
          glassEffectStyle="regular"
        >
          <View style={styles.summaryHeader}>
            <IconSymbol name="chart.bar.fill" color={colors.primary} size={24} />
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Inventory Overview
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.text }]}>
                {totalItems}
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Total Items
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.text }]}>
                {totalCount}
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Total Count
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.text }]}>
                {categories.length}
              </Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                Categories
              </Text>
            </View>
          </View>
          <Text style={[styles.lastSaved, { color: colors.textSecondary }]}>
            Last saved: {formatLastSaved()}
          </Text>
        </GlassView>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          
          <Pressable
            style={[styles.exportAllButton, isExporting && styles.disabledButton]}
            onPress={handleExportAllData}
            disabled={isExporting}
          >
            <GlassView
              style={[
                styles.exportAllButtonContent,
                Platform.OS !== 'ios' && { backgroundColor: colors.primary },
                isExporting && styles.disabledButtonGlass
              ]}
              glassEffectStyle="regular"
            >
              {isExporting ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.exportAllButtonText}>Exporting...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="square.and.arrow.up.fill" color="white" size={20} />
                  <Text style={styles.exportAllButtonText}>Export All Data</Text>
                </>
              )}
            </GlassView>
          </Pressable>
        </View>

        {/* Test Data Generator */}
        {totalItems === 0 && (
          <View style={styles.testDataSection}>
            <TestDataGenerator />
          </View>
        )}

        {/* Management Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Management
          </Text>
          
          {renderFeatureCard(
            'Export & Import',
            'Export data to Excel or import from files',
            'square.and.arrow.up',
            '/export',
            colors.primary
          )}
          
          {renderFeatureCard(
            'Category Management',
            'Add, edit, and organize inventory categories',
            'folder.fill',
            '/category-management',
            colors.secondary
          )}
        </View>

        {/* Reset Controls */}
        <View style={styles.resetSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reset Data & Testing
          </Text>
          <ResetControls onResetComplete={handleResetComplete} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  lastSaved: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  exportAllButton: {
    borderRadius: 12,
  },
  exportAllButtonContent: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testDataSection: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureCardPressable: {
    marginBottom: 12,
    borderRadius: 12,
  },
  featureCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  resetSection: {
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonGlass: {
    backgroundColor: colors.textSecondary,
  },
});
