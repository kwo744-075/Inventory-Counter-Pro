
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useFeatures } from '@/contexts/FeatureContext';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'scanning' | 'notifications' | 'analytics' | 'integration' | 'security' | 'productivity';
  status: 'available' | 'coming-soon' | 'enabled';
  complexity: 'easy' | 'medium' | 'advanced';
  estimatedTime: string;
  benefits: string[];
  dependencies?: string[];
}

const featureCategories = {
  scanning: { title: 'Scanning & Capture', color: '#007AFF', icon: 'camera.fill' },
  notifications: { title: 'Notifications', color: '#FF3B30', icon: 'bell.fill' },
  analytics: { title: 'Analytics & Reports', color: '#34C759', icon: 'chart.bar.fill' },
  integration: { title: 'Integrations', color: '#FF9500', icon: 'link' },
  security: { title: 'Security & Backup', color: '#5856D6', icon: 'lock.fill' },
  productivity: { title: 'Productivity', color: '#AF52DE', icon: 'bolt.fill' },
};

const availableFeatures: Feature[] = [
  {
    id: 'barcode-scanner',
    title: 'Barcode Scanner',
    description: 'Scan barcodes to quickly add items and lookup product information',
    icon: 'barcode.viewfinder',
    category: 'scanning',
    status: 'available',
    complexity: 'medium',
    estimatedTime: '2-3 hours',
    benefits: [
      'Faster item entry',
      'Reduced manual errors',
      'Product lookup integration',
      'Batch scanning support'
    ],
    dependencies: ['expo-camera', 'expo-barcode-scanner']
  },
  {
    id: 'photo-capture',
    title: 'Photo Documentation',
    description: 'Take photos of items for visual inventory tracking',
    icon: 'camera',
    category: 'scanning',
    status: 'available',
    complexity: 'easy',
    estimatedTime: '1-2 hours',
    benefits: [
      'Visual item identification',
      'Damage documentation',
      'Before/after comparisons',
      'Enhanced reporting'
    ],
    dependencies: ['expo-image-picker']
  },
  {
    id: 'low-stock-alerts',
    title: 'Low Stock Alerts',
    description: 'Get notified when inventory levels drop below thresholds',
    icon: 'exclamationmark.triangle.fill',
    category: 'notifications',
    status: 'available',
    complexity: 'medium',
    estimatedTime: '2-3 hours',
    benefits: [
      'Prevent stockouts',
      'Automated reorder reminders',
      'Customizable thresholds',
      'Push notifications'
    ],
    dependencies: ['expo-notifications']
  },
  {
    id: 'inventory-analytics',
    title: 'Advanced Analytics',
    description: 'Detailed charts and insights about your inventory trends',
    icon: 'chart.line.uptrend.xyaxis',
    category: 'analytics',
    status: 'available',
    complexity: 'medium',
    estimatedTime: '3-4 hours',
    benefits: [
      'Usage trend analysis',
      'Seasonal patterns',
      'Cost tracking',
      'Performance metrics'
    ]
  },
  {
    id: 'cloud-backup',
    title: 'Cloud Backup',
    description: 'Automatically backup your inventory data to the cloud',
    icon: 'icloud.fill',
    category: 'security',
    status: 'available',
    complexity: 'advanced',
    estimatedTime: '4-5 hours',
    benefits: [
      'Data protection',
      'Multi-device sync',
      'Automatic backups',
      'Restore capabilities'
    ],
    dependencies: ['Supabase or Firebase']
  },
  {
    id: 'supplier-management',
    title: 'Supplier Management',
    description: 'Track suppliers, contacts, and purchase orders',
    icon: 'person.2.fill',
    category: 'integration',
    status: 'available',
    complexity: 'advanced',
    estimatedTime: '5-6 hours',
    benefits: [
      'Supplier database',
      'Contact management',
      'Purchase order tracking',
      'Price comparison'
    ]
  },
  {
    id: 'voice-commands',
    title: 'Voice Commands',
    description: 'Use voice commands for hands-free inventory updates',
    icon: 'mic.fill',
    category: 'productivity',
    status: 'coming-soon',
    complexity: 'advanced',
    estimatedTime: '6-8 hours',
    benefits: [
      'Hands-free operation',
      'Faster data entry',
      'Accessibility support',
      'Multi-language support'
    ]
  },
  {
    id: 'batch-operations',
    title: 'Batch Operations',
    description: 'Perform bulk updates, imports, and exports efficiently',
    icon: 'square.stack.3d.up.fill',
    category: 'productivity',
    status: 'available',
    complexity: 'medium',
    estimatedTime: '3-4 hours',
    benefits: [
      'Bulk item updates',
      'CSV import/export',
      'Mass category changes',
      'Batch printing'
    ]
  },
  {
    id: 'location-tracking',
    title: 'Location Tracking',
    description: 'Track item locations within your facility',
    icon: 'location.fill',
    category: 'productivity',
    status: 'available',
    complexity: 'medium',
    estimatedTime: '3-4 hours',
    benefits: [
      'Item location mapping',
      'Zone-based organization',
      'Quick item finding',
      'Movement history'
    ]
  },
  {
    id: 'qr-code-labels',
    title: 'QR Code Labels',
    description: 'Generate and print QR code labels for items',
    icon: 'qrcode',
    category: 'productivity',
    status: 'available',
    complexity: 'easy',
    estimatedTime: '2-3 hours',
    benefits: [
      'Quick item identification',
      'Label printing',
      'Custom QR codes',
      'Mobile scanning'
    ]
  }
];

export default function FeaturesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const { addFeatureRequest, featureRequests } = useFeatures();

  const filteredFeatures = selectedCategory 
    ? availableFeatures.filter(feature => feature.category === selectedCategory)
    : availableFeatures;

  const handleFeaturePress = (feature: Feature) => {
    if (feature.status === 'coming-soon') {
      Alert.alert(
        'Coming Soon',
        `${feature.title} is currently in development and will be available in a future update.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      `Add ${feature.title}?`,
      `This will add ${feature.title} to your inventory app.\n\nEstimated implementation time: ${feature.estimatedTime}\nComplexity: ${feature.complexity}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Feature', 
          onPress: () => handleAddFeature(feature),
          style: 'default'
        }
      ]
    );
  };

  const handleAddFeature = (feature: Feature) => {
    // Check if feature is already requested
    const existingRequest = featureRequests.find(req => req.title === feature.title);
    if (existingRequest) {
      Alert.alert(
        'Feature Already Requested',
        `${feature.title} is already in your feature request list with status: ${existingRequest.status}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Add to feature requests
    addFeatureRequest({
      title: feature.title,
      description: feature.description,
      category: feature.category,
      priority: 'medium',
      estimatedTime: feature.estimatedTime,
      complexity: feature.complexity,
    });

    Alert.alert(
      'Feature Request Added!',
      `${feature.title} has been added to your feature request list. I'll implement this feature for you next!\n\nYou can view all your feature requests in the Profile tab.`,
      [{ text: 'Great!' }]
    );
    console.log('Feature requested:', feature.title);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return '#34C759';
      case 'medium': return '#FF9500';
      case 'advanced': return '#FF3B30';
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#34C759';
      case 'coming-soon': return '#FF9500';
      case 'enabled': return '#007AFF';
      default: return colors.textSecondary;
    }
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
        <Pressable
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextActive
          ]}>
            All Features
          </Text>
        </Pressable>
        {Object.entries(featureCategories).map(([key, category]) => (
          <Pressable
            key={key}
            style={[
              styles.categoryChip,
              selectedCategory === key && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(selectedCategory === key ? null : key)}
          >
            <IconSymbol 
              name={category.icon as any} 
              size={16} 
              color={selectedCategory === key ? 'white' : category.color} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === key && styles.categoryChipTextActive
            ]}>
              {category.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderFeatureCard = (feature: Feature) => {
    const isExpanded = expandedFeature === feature.id;
    const categoryInfo = featureCategories[feature.category];

    return (
      <Pressable
        key={feature.id}
        style={styles.featureCardPressable}
        onPress={() => setExpandedFeature(isExpanded ? null : feature.id)}
      >
        <GlassView style={[
          styles.featureCard,
          Platform.OS !== 'ios' && { backgroundColor: colors.card }
        ]} glassEffectStyle="regular">
          <View style={styles.featureHeader}>
            <View style={[styles.featureIcon, { backgroundColor: categoryInfo.color }]}>
              <IconSymbol name={feature.icon as any} color="white" size={24} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
            <View style={styles.featureStatus}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(feature.status) }]}>
                <Text style={styles.statusText}>
                  {feature.status === 'available' ? 'Available' : 
                   feature.status === 'coming-soon' ? 'Soon' : 'Enabled'}
                </Text>
              </View>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.featureDetails}>
              <View style={styles.featureMetrics}>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Complexity
                  </Text>
                  <View style={[styles.complexityBadge, { backgroundColor: getComplexityColor(feature.complexity) }]}>
                    <Text style={styles.complexityText}>
                      {feature.complexity.charAt(0).toUpperCase() + feature.complexity.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.metric}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Est. Time
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {feature.estimatedTime}
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsSection}>
                <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                  Benefits:
                </Text>
                {feature.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <IconSymbol name="checkmark.circle.fill" color="#34C759" size={16} />
                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              {feature.dependencies && (
                <View style={styles.dependenciesSection}>
                  <Text style={[styles.dependenciesTitle, { color: colors.text }]}>
                    Dependencies:
                  </Text>
                  <Text style={[styles.dependenciesText, { color: colors.textSecondary }]}>
                    {feature.dependencies.join(', ')}
                  </Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.addFeatureButton,
                  feature.status === 'coming-soon' && styles.addFeatureButtonDisabled
                ]}
                onPress={() => handleFeaturePress(feature)}
              >
                <Text style={styles.addFeatureButtonText}>
                  {feature.status === 'coming-soon' ? 'Coming Soon' : 'Add This Feature'}
                </Text>
              </Pressable>
            </View>
          )}
        </GlassView>
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Feature Expansion",
          headerLargeTitle: Platform.OS === 'ios',
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Expand Your Inventory App
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Choose from these powerful features to enhance your inventory management experience
            </Text>
          </View>

          {renderCategoryFilter()}

          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {selectedCategory 
                ? `${featureCategories[selectedCategory as keyof typeof featureCategories].title} Features`
                : `All Features (${filteredFeatures.length})`
              }
            </Text>
            
            <View style={styles.featuresList}>
              {filteredFeatures.map(renderFeatureCard)}
            </View>
          </View>

          <View style={styles.footerSection}>
            <GlassView style={[
              styles.footerCard,
              Platform.OS !== 'ios' && { backgroundColor: colors.card }
            ]} glassEffectStyle="regular">
              <IconSymbol name="lightbulb.fill" color="#FF9500" size={24} />
              <Text style={[styles.footerTitle, { color: colors.text }]}>
                Have a Custom Feature Idea?
              </Text>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Let me know what specific functionality you'd like to add to your inventory app, and I'll implement it for you!
              </Text>
            </GlassView>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoryFilter: {
    marginBottom: 24,
  },
  categoryScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureCardPressable: {
    borderRadius: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  featureDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featureMetrics: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  complexityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complexityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  dependenciesSection: {
    marginBottom: 20,
  },
  dependenciesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dependenciesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addFeatureButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addFeatureButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  addFeatureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSection: {
    marginTop: 20,
  },
  footerCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
