import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";

export default function VerifyScreen() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const cursorAnim = React.useRef(new Animated.Value(1)).current;
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Blinking cursor animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const focusInput = () => {
    inputRef.current?.focus();
  };

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

  async function handleVerify() {
    if (!isSignInLoaded || !isSignUpLoaded || !code.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        if (signUp.status === "complete" && signUp.createdSessionId) {
          await setSignUpActive({ session: signUp.createdSessionId });
          return;
        }
        const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (result.status === "complete" && result.createdSessionId) {
          await setSignUpActive({ session: result.createdSessionId });
        } else {
          console.log("Signup incomplete:", result);
          setError(`Verification incomplete (Status: ${result.status}). Check Clerk dashboard settings (e.g. required First Name).`);
        }
      } else {
        if (signIn.status === "complete" && signIn.createdSessionId) {
          await setSignInActive({ session: signIn.createdSessionId });
          return;
        }
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (result.status === "complete" && result.createdSessionId) {
          await setSignInActive({ session: result.createdSessionId });
        } else {
          console.log("Signin incomplete:", result);
          setError(`Verification incomplete (Status: ${result.status}).`);
        }
      }
    } catch (err: any) {
      console.error("Verify error:", err);
      const errCode = err.errors?.[0]?.code;
      if (errCode === "verification_already_verified") {
         if (mode === "signup" && signUp.createdSessionId) {
            await setSignUpActive({ session: signUp.createdSessionId });
         } else if (mode === "signin" && signIn.createdSessionId) {
            await setSignInActive({ session: signIn.createdSessionId });
         } else {
            router.replace("/(public)/login");
         }
      } else {
         setError(err.errors?.[0]?.longMessage || "Invalid code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!isSignInLoaded || !isSignUpLoaded) return;
    try {
      if (mode === "signup") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        const firstFactor = signIn.supportedFirstFactors?.find(
          (f: any) => f.strategy === "email_code"
        );
        if (firstFactor && "emailAddressId" in firstFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: firstFactor.emailAddressId,
          });
        }
      }
      setError("");
    } catch (err: any) {
      setError("Failed to resend code.");
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F0F4FF', '#E0E7FF'] as any}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Dynamic Background Elements */}
      <View style={[styles.glowBall, { top: -50, left: -100, backgroundColor: '#00C2FF', opacity: 0.2 }]} />
      <View style={[styles.glowBall, { bottom: -100, right: -50, backgroundColor: '#7C5CFF', opacity: 0.25 }]} />
      <View style={[styles.glowBall, { top: '20%', right: -150, width: 300, height: 300, backgroundColor: '#FFB6C1', opacity: 0.15 }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.hero}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="mail-open" size={44} color={Colors.white} />
              </LinearGradient>
              <View style={styles.iconRing} />
            </View>
            <Text style={styles.title}>Verify Identity</Text>
            <Text style={styles.subtitle}>
              Enter the unique 6-digit code sent to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardLabel}>VERIFICATION CODE</Text>
            
            <Pressable style={styles.inputWrapper} onPress={focusInput}>
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenInput}
                selectionColor="transparent"
                caretHidden
              />
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = code[index] || "";
                  const isFocused = code.length === index;
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.otpBox, 
                        isFocused && styles.otpBoxFocused,
                        digit !== "" && styles.otpBoxFilled
                      ]}
                    >
                      <Text style={styles.otpText}>{digit}</Text>
                      {isFocused && (
                        <Animated.View style={[styles.cursor, { opacity: cursorAnim }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </Pressable>

            {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleVerify}
              disabled={loading || code.length < 6}
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
                      <Text style={styles.buttonText}>Verify Account</Text>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.footerActions}>
              <TouchableOpacity onPress={handleResend} style={styles.actionBtn}>
                <Text style={styles.resendBtnText}>Resend Code</Text>
              </TouchableOpacity>
              
              <View style={styles.actionDivider} />
              
              <TouchableOpacity onPress={() => router.back()} style={styles.actionBtn}>
                <Text style={styles.backBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#CBD5E1', fontSize: 10 }}>OTP SYSTEM V3.0</Text>
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
  iconWrapper: {
    position: 'relative',
    marginBottom: 28,
  },
  iconCircle: {
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
  iconRing: {
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
    textAlign: "center",
    lineHeight: 24,
    maxWidth: '90%',
  },
  emailText: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.primary,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 28,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Theme.shadows.primary,
    zIndex: 1,
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
    marginBottom: 32,
    position: 'relative',
    height: 80,
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  otpBox: {
    width: 42,
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  otpBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  otpBoxFilled: {
    borderColor: Colors.primary + '50',
  },
  otpText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 24,
    color: '#1E293B',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: Colors.primary,
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
    textAlign: "center",
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
  footerActions: {
    alignItems: 'center',
    marginTop: 28,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  resendBtnText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: Colors.primary,
  },
  actionDivider: {
    height: 1,
    width: 30,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  backBtnText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 15,
    color: '#64748B',
  },
});
