import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useAppAuth } from "@/utils/auth";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ChangePasswordScreen() {
  const { user, updateUser } = useAppAuth();
  const changePassword = useMutation(api.users.firstLoginChangePassword);
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  async function handleChangePassword() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await changePassword({ newPassword: newPassword.trim() });
      if (user) {
        await updateUser({
          ...user,
          is_first_login: false,
        });
        if (!user.onboardingComplete) {
          router.replace("/(auth)/onboarding/welcome");
        } else {
          router.replace("/(auth)/(tabs)");
        }
      } else {
        router.replace("/(auth)/(tabs)");
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      setError(err.message || "Failed to change password. Try again.");
    } finally {
      setLoading(false);
    }
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.hero}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
              >
                <Ionicons name="key" size={44} color={Colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Please choose a new secure password for your account.</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>UPDATE CREDENTIALS</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={Colors.primary}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.inputWrapper, { marginTop: -8 }]}>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={Colors.primary}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleChangePassword}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
            >
              <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Update Password</Text>
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  hero: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 28,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 34,
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 28,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  cardLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    height: 64,
  },
  inputIcon: {
    marginRight: 14,
    opacity: 0.8,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.fontFamily.medium,
    fontSize: 17,
    color: '#0F172A',
  },
  errorContainer: {
    marginBottom: 16,
    backgroundColor: Colors.error + '10',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  buttonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 0.5,
  },
});
