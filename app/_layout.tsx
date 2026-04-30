import { Slot, useRouter, useSegments } from "expo-router";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { tokenCache } from "@/utils/cache";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local"
  );
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL in .env.local");
}

const convex = new ConvexReactClient(convexUrl);

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const { user: clerkUser } = useAuth();
  const dbUser = useQuery(api.users.getByClerkId, clerkUser ? { clerkId: clerkUser } : "skip");
  const appState = useRef(AppState.currentState);
  const lastActiveTime = useRef(Date.now());

  useEffect(() => {
    if (!isLoaded || !fontsLoaded) return;

    const inPublicGroup = segments[0] === "(public)";
    const inAuthGroup = segments[0] === "(auth)";

    // Initial redirect
    if (isSignedIn && inPublicGroup) {
      router.replace("/(auth)/biometric");
    } else if (!isSignedIn && inAuthGroup) {
      router.replace("/(public)/login");
    }
  }, [isSignedIn, isLoaded, segments, fontsLoaded]);

  // Handle Inactivity Lock (5 minutes)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        const elapsed = Date.now() - lastActiveTime.current;
        const fiveMinutes = 5 * 60 * 1000;

        if (isSignedIn && dbUser?.biometricEnabled && elapsed > fiveMinutes) {
          router.replace("/(auth)/biometric");
        }
      }

      if (nextAppState.match(/inactive|background/)) {
        lastActiveTime.current = Date.now();
      }

      appState.current = nextAppState;
    });

    return () => { subscription.remove(); };
  }, [isSignedIn, dbUser?.biometricEnabled]);

  useEffect(() => {
    if (isLoaded && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded, fontsLoaded]);

  if (!isLoaded || !fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ConvexProvider client={convex}>
        <ClerkLoaded>
          <InitialLayout />
        </ClerkLoaded>
      </ConvexProvider>
    </ClerkProvider>
  );
}
