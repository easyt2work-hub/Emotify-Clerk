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
  ScrollView,
} from "react-native";
import { useAppAuth } from "@/utils/auth";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, loginWithBiometrics, biometricsEnabled } = useAppAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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

  async function handleBiometricLogin() {
    setBiometricLoading(true);
    setError("");
    try {
      const result = await loginWithBiometrics();
      if (result && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      console.error("Biometric login error:", err);
      setError("Biometric authentication failed.");
    } finally {
      setBiometricLoading(false);
    }
  }

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Calm, warm white and soft gradient background */}
      <LinearGradient
        colors={['#FAF9F5', '#EBF5FF', '#F3E8FF'] as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Gentle, calm visual elements (soft blobs) */}
      <View style={[styles.softBlob, { top: -100, right: -100, backgroundColor: '#E0F2FE', opacity: 0.8 }]} />
      <View style={[styles.softBlob, { bottom: -100, left: -100, backgroundColor: '#E8F0EC', opacity: 0.8 }]} />
      <View style={[styles.softBlob, { top: '40%', left: -120, width: 250, height: 250, backgroundColor: '#F3E8FF', opacity: 0.6 }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(40, insets.top),
              paddingBottom: Math.max(40, insets.bottom + 20),
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.hero}>
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={['#A7F3D0', '#93C5FD'] as any} // Calm Sage and Soft Blue
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoCircle}
                >
                  <Ionicons name="leaf-outline" size={40} color="#1E293B" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Welcome to Emotify</Text>
              <Text style={styles.subtitle}>A peaceful space for your mind.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Sign In</Text>

              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
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
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, (!phone.trim() || !password.trim()) && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading || !phone.trim() || !password.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#FAF9F5" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {biometricsEnabled ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator color="#1E293B" />
                    ) : (
                      <>
                        <Ionicons name="finger-print-outline" size={24} color="#1E293B" />
                        <Text style={styles.biometricButtonText}>Login with Biometrics</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
            </View>

            <View style={styles.footer}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#94A3B8" />
              <Text style={styles.footerText}>Secure Biometric & JWT Authentication</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  softBlob: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    zIndex: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  content: {
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#93C5FD', // Calm Soft Blue
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: '#FAF9F5',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 12,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#F1F5F9',
  },
  biometricButtonText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: '#1E293B',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: '#94A3B8',
  },
});
