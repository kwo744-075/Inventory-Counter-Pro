
import React, { useState } from 'react';
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
} from 'react-native';
import { Stack } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { colors } from '@/styles/commonStyles';
import { useInventory } from '@/contexts/InventoryContext';
import { IconSymbol } from '@/components/IconSymbol';
import { CategoryManagement } from '@/types/inventory';

const AVAILABLE_ICONS = [
  'drop.fill',
  'circle.hexagongrid.fill',
  'wind',
  'car.fill',
  'drop.triangle.fill',
  'ellipsis.circle.fill',
  'wrench.fill',
  'gear.fill',
  'bolt.fill',
  'hammer.fill',
  'screwdriver.fill',
  'paintbrush.fill',
];

const AVAILABLE_COLORS = [
  '#007AFF',
  '#FF9500',
  '#5856D6',
  '#34C759',
  '#FF3B30',
  '#8E8E93',
  '#FF2D92',
  '#5AC8FA',
  '#FFCC00',
  '#AF52DE',
  '#32D74B',
  '#FF6482',
];

export default function CategoryManagementScreen() {
  const { categories, addCategory, updateCategory, deleteCategory, toggleCategoryLock } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryManagement | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    addCategory({
      name: newCategoryName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      isLocked: false,
      isCustom: true,
    });

    setNewCategoryName('');
    setSelectedIcon(AVAILABLE_ICONS[0]);
    setSelectedColor(AVAILABLE_COLORS[0]);
    setShowAddModal(false);
    
    Alert.alert('Success', 'Category added successfully');
  };

  const handleEditCategory = (category: CategoryManagement) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowAddModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    updateCategory(editingCategory.id, {
      name: newCategoryName.trim(),
      icon: selectedIcon,
      color: selectedColor,
    });

    setEditingCategory(null);
    setNewCategoryName('');
    setSelectedIcon(AVAILABLE_ICONS[0]);
    setSelectedColor(AVAILABLE_COLORS[0]);
    setShowAddModal(false);
    
    Alert.alert('Success', 'Category updated successfully');
  };

  const handleDeleteCategory = (category: CategoryManagement) => {
    console.log('🗑️ Delete button pressed for category:', {
      id: category.id,
      name: category.name,
      isCustom: category.isCustom,
      isLocked: category.isLocked
    });

    // Check if category is custom before allowing deletion
    if (!category.isCustom) {
      Alert.alert(
        'Cannot Delete System Category',
        `"${category.name}" is a system category and cannot be deleted. Only custom categories can be deleted.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Custom Category',
      `Are you sure you want to delete the custom category "${category.name}"?\n\nThis will also delete all items and item numbers in this category. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('🗑️ User confirmed deletion of custom category:', category.name);
            try {
              deleteCategory(category.id);
              Alert.alert('Success', `Custom category "${category.name}" has been deleted successfully.`);
            } catch (error) {
              console.error('❌ Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleLock = (category: CategoryManagement) => {
    if (!category.isCustom) {
      Alert.alert('System Category', 'System categories cannot be unlocked');
      return;
    }

    Alert.alert(
      category.isLocked ? 'Unlock Category' : 'Lock Category',
      `Are you sure you want to ${category.isLocked ? 'unlock' : 'lock'} "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: category.isLocked ? 'Unlock' : 'Lock',
          onPress: () => toggleCategoryLock(category.id),
        },
      ]
    );
  };

  const resetModal = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setSelectedIcon(AVAILABLE_ICONS[0]);
    setSelectedColor(AVAILABLE_COLORS[0]);
    setShowAddModal(false);
  };

  const renderCategoryItem = (category: CategoryManagement) => (
    <GlassView
      key={category.id}
      style={[styles.categoryItem, Platform.OS !== 'ios' && { backgroundColor: colors.card }]}
      glassEffectStyle="regular"
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <IconSymbol name={category.icon as any} color="white" size={24} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {category.name}
          </Text>
          <View style={styles.categoryTags}>
            {category.isLocked && (
              <View style={[styles.tag, styles.lockedTag]}>
                <IconSymbol name="lock.fill" color="white" size={12} />
                <Text style={styles.tagText}>Locked</Text>
              </View>
            )}
            {category.isCustom && (
              <View style={[styles.tag, styles.customTag]}>
                <Text style={styles.tagText}>Custom</Text>
              </View>
            )}
            {!category.isCustom && (
              <View style={[styles.tag, styles.systemTag]}>
                <Text style={styles.tagText}>System</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.categoryActions}>
        <Pressable
          style={[styles.actionButton, styles.lockButton]}
          onPress={() => handleToggleLock(category)}
          disabled={!category.isCustom}
        >
          <IconSymbol
            name={category.isLocked ? "lock.fill" : "lock.open.fill"}
            color={category.isCustom ? colors.primary : colors.textSecondary}
            size={18}
          />
        </Pressable>
        
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditCategory(category)}
        >
          <IconSymbol
            name="pencil"
            color={colors.accent}
            size={18}
          />
        </Pressable>
        
        <Pressable
          style={[
            styles.actionButton, 
            styles.deleteButton,
            !category.isCustom && styles.disabledButton
          ]}
          onPress={() => handleDeleteCategory(category)}
          disabled={!category.isCustom}
        >
          <IconSymbol
            name="trash"
            color={category.isCustom ? "#FF3B30" : colors.textSecondary}
            size={18}
          />
        </Pressable>
      </View>
    </GlassView>
  );

  const renderIconSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Select Icon</Text>
      <View style={styles.iconGrid}>
        {AVAILABLE_ICONS.map((icon) => (
          <Pressable
            key={icon}
            style={[
              styles.iconOption,
              selectedIcon === icon && styles.selectedIconOption,
              { backgroundColor: selectedIcon === icon ? selectedColor : colors.cardSecondary }
            ]}
            onPress={() => setSelectedIcon(icon)}
          >
            <IconSymbol
              name={icon as any}
              color={selectedIcon === icon ? 'white' : colors.text}
              size={20}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorTitle, { color: colors.text }]}>Select Color</Text>
      <View style={styles.colorGrid}>
        {AVAILABLE_COLORS.map((color) => (
          <Pressable
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <IconSymbol name="checkmark" color="white" size={16} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Debug info for troubleshooting
  console.log('📊 Current categories in management screen:', categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    isCustom: cat.isCustom,
    isLocked: cat.isLocked
  })));

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Category Management',
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
              Manage Categories
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Add, edit, or remove inventory categories. Only custom categories can be deleted.
            </Text>
          </View>

          <Pressable
            style={styles.addButtonPressable}
            onPress={() => setShowAddModal(true)}
          >
            <GlassView
              style={[styles.addButton, Platform.OS !== 'ios' && { backgroundColor: colors.primary }]}
              glassEffectStyle="regular"
            >
              <IconSymbol name="plus" color="white" size={20} />
              <Text style={styles.addButtonText}>Add New Category</Text>
            </GlassView>
          </Pressable>

          <View style={styles.categoriesList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Categories ({categories.length})
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Custom categories can be deleted, system categories cannot
            </Text>
            {categories.map(renderCategoryItem)}
          </View>
        </ScrollView>

        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={resetModal}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={resetModal}>
                <Text style={[styles.modalCancelButton, { color: colors.primary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <Pressable onPress={editingCategory ? handleUpdateCategory : handleAddCategory}>
                <Text style={[styles.modalSaveButton, { color: colors.primary }]}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Category Name
                </Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.cardSecondary,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Enter category name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {renderIconSelector()}
              {renderColorSelector()}

              <View style={styles.previewContainer}>
                <Text style={[styles.selectorTitle, { color: colors.text }]}>Preview</Text>
                <GlassView
                  style={[styles.previewCard, Platform.OS !== 'ios' && { backgroundColor: colors.card }]}
                  glassEffectStyle="regular"
                >
                  <View style={[styles.categoryIcon, { backgroundColor: selectedColor }]}>
                    <IconSymbol name={selectedIcon as any} color="white" size={24} />
                  </View>
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {newCategoryName || 'Category Name'}
                  </Text>
                </GlassView>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
  addButtonPressable: {
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesList: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  categoryItem: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lockedTag: {
    backgroundColor: '#FF3B30',
  },
  customTag: {
    backgroundColor: colors.accent,
  },
  systemTag: {
    backgroundColor: colors.primary,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
  },
  lockButton: {},
  editButton: {},
  deleteButton: {},
  disabledButton: {
    opacity: 0.3,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIconOption: {
    borderWidth: 3,
    borderColor: 'white',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  previewContainer: {
    marginTop: 24,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});
