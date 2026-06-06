import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { REINFORCEMENT_MESSAGES } from "@/constants/Wellness";

const { width, height } = Dimensions.get('window');

export default function JPMRScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const [step, setStep] = useState(1);
  const [preIntensity, setPreIntensity] = useState(5);
  const [postIntensity, setPostIntensity] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [improvement, setImprovement] = useState(0);

  const createLog = useMutation(api.jpmrLogs.create);

  const togglePlay = () => setIsPlaying(!isPlaying);

  function handleFinish() {
    const diff = preIntensity - postIntensity;
    const percent = preIntensity > 0 ? Math.round((diff / preIntensity) * 100) : 0;
    setImprovement(percent);
    setStep(4);
  }

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createLog({
        userId: user.id,
        preIntensity,
        postIntensity,
        duration: 300,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const randomMessage = REINFORCEMENT_MESSAGES[Math.floor(Math.random() * REINFORCEMENT_MESSAGES.length)];
      Alert.alert("Session Saved! ✨", randomMessage, [{ text: "Done", onPress: () => router.back() }]);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundDark, Colors.primaryDark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Body Relaxation</Text>
            <Text style={styles.subtitle}>Before we begin, how much tension do you feel?</Text>
            
            <View style={styles.intensityCircle}>
              <Text style={styles.intensityValue}>{preIntensity}</Text>
            </View>

            <View style={styles.sliderMock}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity 
                  key={n} 
                  onPress={() => setPreIntensity(n)}
                  style={[styles.sliderDot, preIntensity === n && styles.sliderDotActive]}
                />
              ))}
            </View>

            <Button 
              title="Start Relaxation" 
              onPress={() => setStep(2)} 
              style={styles.actionBtn}
              textStyle={{ color: Colors.primary }}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Breathe & Release</Text>
            <Text style={styles.subtitle}>Follow the guidance and let go of tension.</Text>
            
            <View style={styles.playerWrapper}>
              <View style={[styles.pulseCircle, isPlaying && styles.pulseActive]} />
              <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={48} 
                  color={Colors.primary} 
                  style={{ marginLeft: isPlaying ? 0 : 5 }} 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.timerText}>{isPlaying ? "Muscle Release in Progress..." : "Paused"}</Text>

            <Button 
              title="End Session" 
              onPress={() => { setIsPlaying(false); setStep(3); }} 
              variant="outline" 
              style={StyleSheet.flatten([styles.actionBtn, { borderColor: Colors.white + '40' }])}
              textStyle={{ color: Colors.white }}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Session Complete</Text>
            <Text style={styles.subtitle}>How does your body feel now?</Text>
            
            <View style={styles.intensityCircle}>
              <Text style={styles.intensityValue}>{postIntensity}</Text>
            </View>

            <View style={styles.sliderMock}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity 
                  key={n} 
                  onPress={() => setPostIntensity(n)}
                  style={[styles.sliderDot, postIntensity === n && styles.sliderDotActive]}
                />
              ))}
            </View>

            <Button 
              title="View Impact" 
              onPress={handleFinish} 
              style={styles.actionBtn}
              textStyle={{ color: Colors.primary }}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Results</Text>
            <Text style={styles.subtitle}>Every moment of relaxation builds resilience.</Text>
            
            <View style={styles.glassResult}>
              <Text style={styles.resultLabel}>Stress Reduction</Text>
              <Text style={styles.resultMain}>{improvement}%</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultSub}>{preIntensity} initial</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white + '60'} />
                <Text style={styles.resultSub}>{postIntensity} now</Text>
              </View>
            </View>

            <Button 
              title="Save & Close" 
              onPress={handleSubmit} 
              loading={isSubmitting} 
              style={styles.actionBtn}
              textStyle={{ color: Colors.primary }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Theme.spacing.xl, paddingTop: 60, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: Theme.spacing.xl },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xxl,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  intensityCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  intensityValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 48,
    color: Colors.white,
  },
  sliderMock: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Theme.spacing.xxl * 2,
  },
  sliderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sliderDotActive: {
    backgroundColor: Colors.secondary,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -3,
  },
  actionBtn: {
    width: width - Theme.spacing.xl * 2,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xl,
    height: 60,
  },
  playerWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    opacity: 0.2,
  },
  pulseActive: {
    // Note: In real RN we'd use Animated.loop but for now implied pulse
    transform: [{ scale: 1.5 }],
    opacity: 0.1,
  },
  timerText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.white,
    marginBottom: Theme.spacing.xxl,
  },
  glassResult: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    width: width - Theme.spacing.xl * 2,
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  resultLabel: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  resultMain: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 64,
    color: Colors.white,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
