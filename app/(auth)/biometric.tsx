import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function BiometricScreen() {
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  
  // "loading" -> "prompt" -> "success" -> "failed"
  const [status, setStatus] = useState<"loading" | "prompt" | "success" | "failed">("loading");

  const appUser = useQuery(api.users.getByClerkId, {
    clerkId: clerkUser?.id ?? "",
  });

  const updateLastLogin = useMutation(api.users.updateLastLogin);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // When appUser loads, decide whether to prompt or skip
  useEffect(() => {
    if (appUser === undefined) return;
    
    // Skip if biometrics not enabled in Profile
    if (!appUser || !appUser.biometricEnabled) {
      proceedToApp();
      return;
    }

    if (status === "loading") {
      checkAndPrompt();
    }
  }, [appUser, status]);

  async function checkAndPrompt() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      proceedToApp();
      return;
    }

    setStatus("prompt");
    authenticate();
  }

  async function authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Emotify",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      setStatus("success");
      if (clerkUser) {
        await updateLastLogin({ clerkId: clerkUser.id });
      }
      proceedToApp();
    } else {
      setStatus("failed");
    }
  }

  function proceedToApp() {
    if (appUser === undefined) return; 

    if (!appUser || !appUser.onboardingComplete) {
      router.replace("/(auth)/onboarding/welcome");
    } else if (!appUser.screeningComplete) {
      router.replace("/(auth)/screening");
    } else {
      router.replace("/(auth)/(tabs)");
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/(public)/login");
  }

  if (status === "loading" || status === "success") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFFFFF', '#F0F4FF', '#E0E7FF'] as any}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowBall, { top: -100, right: -100, backgroundColor: Colors.primary, opacity: 0.2 }]} />
        <View style={[styles.glowBall, { bottom: -100, left: -100, backgroundColor: Colors.secondary, opacity: 0.15 }]} />
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.iconCircle}
            >
              <Ionicons 
                name={status === "success" ? "checkmark-circle" : "finger-print"} 
                size={50} 
                color={Colors.white} 
              />
            </LinearGradient>
            <View style={styles.iconRing} />
          </Animated.View>
          <Text style={styles.title}>
            {status === "success" ? "Identity Verified" : "Securing Space"}
          </Text>
          <Text style={styles.subtitle}>
            {status === "success" ? "Preparing your dashboard..." : "Verifying your biometric identity..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F4FF', '#E0E7FF'] as any}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Dynamic Background Elements */}
      <View style={[styles.glowBall, { top: -50, right: -100, backgroundColor: '#7C5CFF', opacity: 0.25 }]} />
      <View style={[styles.glowBall, { bottom: -100, left: -50, backgroundColor: '#00C2FF', opacity: 0.2 }]} />
      <View style={[styles.glowBall, { top: '30%', left: -150, width: 300, height: 300, backgroundColor: '#FFB6C1', opacity: 0.15 }]} />

      <View style={styles.content}>
        <View style={styles.glassCard}>
          <View style={styles.hero}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={status === "failed" ? ['#FF4B4B', '#FF8F8F'] : [Colors.primary, Colors.secondary]}
                style={styles.iconCircle}
              >
                <Ionicons 
                  name={status === "failed" ? "lock-closed" : "finger-print"} 
                  size={50} 
                  color={Colors.white} 
                />
              </LinearGradient>
              <View style={[styles.iconRing, status === "failed" && { borderColor: '#FF4B4B40' }]} />
            </View>
            <Text style={styles.title}>
              {status === "failed" ? "Access Denied" : "App Locked"}
            </Text>
            <Text style={styles.subtitle}>
              {status === "failed"
                ? "We couldn't verify your identity. Please try again to continue."
                : "Your data is encrypted. Use biometrics to unlock your space."}
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity activeOpacity={0.9} onPress={authenticate}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockBtn}
              >
                <Ionicons name="key" size={20} color={Colors.white} />
                <Text style={styles.unlockBtnText}>Unlock Emotify</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutBtn}
            >
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
          <Text style={styles.footerText}>Enterprise Grade Security</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowBall: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 32,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Theme.shadows.primary,
    marginBottom: 32,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    ...Theme.shadows.primary,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  iconRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
    opacity: 0.5,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 32,
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: '#64748B',
    textAlign: "center",
    lineHeight: 24,
    maxWidth: '90%',
  },
  buttons: {
    width: "100%",
  },
  unlockBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...Theme.shadows.secondary,
  },
  unlockBtnText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 18,
    color: Colors.white,
  },
  logoutBtn: {
    marginTop: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: '#94A3B8',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: '#94A3B8',
  },
});
