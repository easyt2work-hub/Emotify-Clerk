import { Slot, useRouter, useSegments } from "expo-router";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { AppState, AppStateStatus } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthProvider, useAppAuth } from "@/utils/auth";

SplashScreen.preventAutoHideAsync();

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL in .env.local");
}

const convex = new ConvexReactClient(convexUrl);

function InitialLayout() {
  const { isAuthenticated, isLoading: authLoading, user, isLoggingOut } = useAppAuth();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const appState = useRef(AppState.currentState);
  const lastActiveTime = useRef(Date.now());

  useEffect(() => {
    if (authLoading || !fontsLoaded) return;

    const inPublicGroup = (segments as string[]).includes("(public)");
    const inAuthGroup = (segments as string[]).includes("(auth)");

    // Never redirect to biometric while logging out — prevents the loop where
    // navigation commits to /(public)/login before isAuthenticated flips to false
    if (!isLoggingOut && isAuthenticated && inPublicGroup) {
      if (user?.is_first_login) {
        router.replace("/(public)/change-password");
      } else {
        if (!user?.onboardingComplete) {
          router.replace("/(auth)/onboarding/welcome");
        } else {
          router.replace("/(auth)/(tabs)");
        }
      }
    } else if (!isAuthenticated && !isLoggingOut && inAuthGroup) {
      router.replace("/(public)/login");
    }
  }, [isAuthenticated, isLoggingOut, authLoading, segments, fontsLoaded, user?.is_first_login, user?.onboardingComplete]);

  useEffect(() => {
    if (!authLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [authLoading, fontsLoaded]);

  if (authLoading || !fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConvexAuthWrapper />
    </AuthProvider>
  );
}

function ConvexAuthWrapper() {
  const { isLoading, isAuthenticated, isLoggingOut, fetchAccessToken } = useAppAuth();

  // Stable ref to fetchAccessToken to avoid recreating useAuth on every render
  const fetchAccessTokenRef = useRef(fetchAccessToken);
  useEffect(() => { fetchAccessTokenRef.current = fetchAccessToken; }, [fetchAccessToken]);

  const useAuth = React.useCallback(() => {
    return {
      isLoading,
      isAuthenticated,
      fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        return fetchAccessTokenRef.current({ forceRefresh: forceRefreshToken });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, isLoggingOut]);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
      <InitialLayout />
    </ConvexProviderWithAuth>
  );
}
