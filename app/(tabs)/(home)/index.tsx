
import React, { useState } from "react";
import { Stack } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

interface InventoryItem {
  id: string;
  name: string;
  count: number;
  color: string;
}

export default function HomeScreen() {
  const theme = useTheme();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Product A', count: 0, color: '#007AFF' },
    { id: '2', name: 'Product B', count: 0, color: '#34C759' },
    { id: '3', name: 'Product C', count: 0, color: '#FF9500' },
  ]);

  const incrementCount = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInventoryItems(items =>
      items.map(item =>
        item.id === id ? { ...item, count: item.count + 1 } : item
      )
    );
  };

  const decrementCount = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInventoryItems(items =>
      items.map(item =>
        item.id === id && item.count > 0 ? { ...item, count: item.count - 1 } : item
      )
    );
  };

  const resetCount = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setInventoryItems(items =>
      items.map(item =>
        item.id === id ? { ...item, count: 0 } : item
      )
    );
  };

  const addNewItem = () => {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#FF2D55'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: `Product ${String.fromCharCode(65 + inventoryItems.length)}`,
      count: 0,
      color: randomColor,
    };
    setInventoryItems([...inventoryItems, newItem]);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={addNewItem}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="plus" color={theme.colors.primary} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => Alert.alert("Settings", "Settings feature coming soon")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol
        name="gear"
        color={theme.colors.primary}
      />
    </Pressable>
  );

  const totalCount = inventoryItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Inventory Counter 1.0",
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            Platform.OS !== 'ios' && styles.scrollContainerWithTabBar
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {/* Total Count Card */}
          <GlassView 
            style={[
              styles.totalCard,
              Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
            ]} 
            glassEffectStyle="regular"
          >
            <Text style={[styles.totalLabel, { color: theme.dark ? '#98989D' : '#666' }]}>
              Total Items Counted
            </Text>
            <Text style={[styles.totalCount, { color: theme.colors.text }]}>
              {totalCount}
            </Text>
          </GlassView>

          {/* Inventory Items */}
          {inventoryItems.map((item) => (
            <GlassView
              key={item.id}
              style={[
                styles.itemCard,
                Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}
              glassEffectStyle="regular"
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <View style={[styles.itemColorDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                </View>
                <Pressable
                  onPress={() => resetCount(item.id)}
                  style={styles.resetButton}
                >
                  <Text style={[styles.resetButtonText, { color: theme.colors.primary }]}>
                    Reset
                  </Text>
                </Pressable>
              </View>

              <View style={styles.counterContainer}>
                <Pressable
                  onPress={() => decrementCount(item.id)}
                  style={[
                    styles.counterButton,
                    item.count === 0 && styles.counterButtonDisabled
                  ]}
                  disabled={item.count === 0}
                >
                  <IconSymbol 
                    name="minus.circle.fill" 
                    size={40} 
                    color={item.count === 0 ? (theme.dark ? '#3A3A3C' : '#E5E5EA') : item.color} 
                  />
                </Pressable>

                <View style={styles.countDisplay}>
                  <Text style={[styles.countText, { color: theme.colors.text }]}>
                    {item.count}
                  </Text>
                </View>

                <Pressable
                  onPress={() => incrementCount(item.id)}
                  style={styles.counterButton}
                >
                  <IconSymbol 
                    name="plus.circle.fill" 
                    size={40} 
                    color={item.color} 
                  />
                </Pressable>
              </View>
            </GlassView>
          ))}

          {/* Add Item Button */}
          <Pressable onPress={addNewItem}>
            <GlassView
              style={[
                styles.addItemCard,
                Platform.OS !== 'ios' && { backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}
              glassEffectStyle="clear"
            >
              <IconSymbol name="plus.circle" size={32} color={theme.colors.primary} />
              <Text style={[styles.addItemText, { color: theme.colors.primary }]}>
                Add New Item
              </Text>
            </GlassView>
          </Pressable>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  scrollContainerWithTabBar: {
    paddingBottom: 100,
  },
  totalCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  totalCount: {
    fontSize: 48,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    padding: 8,
  },
  counterButtonDisabled: {
    opacity: 0.5,
  },
  countDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 36,
    fontWeight: '700',
  },
  addItemCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerButtonContainer: {
    padding: 6,
  },
});
