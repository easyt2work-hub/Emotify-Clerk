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
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAppAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const result = await login(phone.trim(), password.trim());
      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong. Try again.");
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
      <View style={[styles.glowBall, { top: '30%', left: -150, width: 300, height: 300, backgroundColor: '#FFB6C1', opacity: 0.15 }]} />

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
                <Ionicons name="leaf" size={44} color={Colors.white} />
              </LinearGradient>
              <View style={styles.logoRing} />
            </View>
            <Text style={styles.title}>Emotify</Text>
            <Text style={styles.subtitle}>Your path to tranquility begins with a single step.</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>SECURE ACCESS</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputBox}>
                <Ionicons name="call" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
                  placeholder="Mobile Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={Colors.primary}
                />
              </View>
            </View>

            <View style={[styles.inputWrapper, { marginTop: -8 }]}>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={Colors.primary}
                />
              </View>
            </View>

            {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleLogin}
              disabled={loading || !phone.trim() || !password.trim()}
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
                      <Text style={styles.buttonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.footerInfo}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.textMuted} />
            <Text style={styles.footerText}>
              Powered by Secure DB Authentication
            </Text>
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
    ...Theme.shadows.primary,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  logoRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    opacity: 0.5,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 38,
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 17,
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
    ...Theme.shadows.primary,
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
    ...Theme.shadows.tertiary,
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
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: '#94A3B8',
  },
});
