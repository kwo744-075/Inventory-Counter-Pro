
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Button } from "@/components/button";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { FeatureProvider } from "@/contexts/FeatureContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#007AFF", // Apple Blue
      background: "#f0f0f0", // Light gray
      card: "#FFFFFF", // White
      text: "#333333", // Dark gray
      border: "#D8D8D8", // Light silver
      notification: "#FF9500", // Orange
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#007AFF", // Apple Blue
      background: "#1c1c1e", // Dark background
      card: "#2c2c2e", // Dark card
      text: "#ffffff", // White text
      border: "#38383a", // Dark border
      notification: "#FF9500", // Orange
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <WidgetProvider>
          <InventoryProvider>
            <FeatureProvider>
            <Stack>
              {/* Main app with tabs */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Modal Demo Screens */}
              <Stack.Screen
                name="modal"
                options={{
                  presentation: "modal",
                  title: "Standard Modal",
                }}
              />
              <Stack.Screen
                name="formsheet"
                options={{
                  presentation: "formSheet",
                  title: "Form Sheet Modal",
                  sheetGrabberVisible: true,
                  sheetAllowedDetents: [0.5, 0.8, 1.0],
                  sheetCornerRadius: 20,
                }}
              />
              <Stack.Screen
                name="transparent-modal"
                options={{
                  presentation: "transparentModal",
                  headerShown: false,
                }}
              />

              {/* Inventory Category Screens */}
              <Stack.Screen
                name="oils"
                options={{
                  presentation: "card",
                  title: "Oils",
                }}
              />
              <Stack.Screen
                name="oil-filters"
                options={{
                  presentation: "card",
                  title: "Oil Filters",
                }}
              />
              <Stack.Screen
                name="air-filters"
                options={{
                  presentation: "card",
                  title: "Air Filters",
                }}
              />
              <Stack.Screen
                name="cabin-filters"
                options={{
                  presentation: "card",
                  title: "Cabin Filters",
                }}
              />
              <Stack.Screen
                name="wipers"
                options={{
                  presentation: "card",
                  title: "Wipers",
                }}
              />
              <Stack.Screen
                name="misc"
                options={{
                  presentation: "card",
                  title: "Miscellaneous",
                }}
              />
              <Stack.Screen
                name="export"
                options={{
                  presentation: "card",
                  title: "Export Inventory",
                }}
              />
              <Stack.Screen
                name="download-guide"
                options={{
                  presentation: "card",
                  title: "Download Guide",
                }}
              />
              <Stack.Screen
                name="features"
                options={{
                  presentation: "card",
                  title: "Feature Expansion",
                }}
              />
            </Stack>
            <SystemBars style={"auto"} />
            </FeatureProvider>
          </InventoryProvider>
        </WidgetProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
