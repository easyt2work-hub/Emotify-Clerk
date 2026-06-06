import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { EMOTIONS, BODY_REGIONS } from "@/constants/Screening";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { REINFORCEMENT_MESSAGES } from "@/constants/Wellness";

const { width } = Dimensions.get('window');

export default function EmotionMapScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const [step, setStep] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [preIntensity, setPreIntensity] = useState(5);
  const [postIntensity, setPostIntensity] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [improvement, setImprovement] = useState(0);

  const createLog = useMutation(api.emotionLogs.create);

  function toggleRegion(region: string) {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  }

  function handleFinish() {
    const diff = preIntensity - postIntensity;
    const percent = preIntensity > 0 ? Math.round((diff / preIntensity) * 100) : 0;
    setImprovement(percent);
    setStep(6);
  }

  async function handleSubmit() {
    if (!user || !selectedEmotion || selectedRegions.length === 0) return;
    setIsSubmitting(true);
    try {
      await createLog({
        userId: user.id,
        emotion: selectedEmotion,
        bodyRegions: selectedRegions,
        preIntensity,
        postIntensity,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const randomMessage = REINFORCEMENT_MESSAGES[Math.floor(Math.random() * REINFORCEMENT_MESSAGES.length)];
      Alert.alert("Journal Saved! 📔", randomMessage, [{ text: "Done", onPress: () => router.back() }]);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  }

  const Progress = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${(step / 6) * 100}%` }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Emotion Mapping</Text>
          <Progress />
        </View>

        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>What are you feeling?</Text>
            <Text style={styles.stepSub}>Select the primary emotion you're experiencing.</Text>
            <View style={styles.grid}>
              {EMOTIONS.map((emotion) => (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    styles.emotionChip,
                    selectedEmotion === emotion.id && styles.emotionChipSelected,
                  ]}
                  onPress={() => setSelectedEmotion(emotion.id)}
                >
                  <Text
                    style={[
                      styles.emotionText,
                      selectedEmotion === emotion.id && styles.emotionTextSelected,
                    ]}
                  >
                    {emotion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Continue"
              onPress={() => setStep(2)}
              disabled={!selectedEmotion}
              style={styles.nextBtn}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Where is it held?</Text>
            <Text style={styles.stepSub}>Tap the areas of your body where you feel this sensation.</Text>
            <View style={styles.grid}>
              {BODY_REGIONS.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.regionChip,
                    selectedRegions.includes(region) && styles.regionChipSelected,
                  ]}
                  onPress={() => toggleRegion(region)}
                >
                  <Text
                    style={[
                      styles.regionText,
                      selectedRegions.includes(region) && styles.regionTextSelected,
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(1)} variant="outline" style={styles.halfBtn} />
              <Button
                title="Next"
                onPress={() => setStep(3)}
                disabled={selectedRegions.length === 0}
                style={styles.halfBtn}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Initial Intensity</Text>
            <Text style={styles.stepSub}>On a scale of 1-10, how strong is this feeling?</Text>
            
            <View style={styles.intensityWrapper}>
              <Text style={styles.intensityNum}>{preIntensity}</Text>
              <View style={styles.sliderMock}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <TouchableOpacity 
                    key={n} 
                    onPress={() => setPreIntensity(n)}
                    style={[styles.sliderDot, preIntensity === n && styles.sliderDotActive]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(2)} variant="outline" style={styles.halfBtn} />
              <Button title="Next" onPress={() => setStep(4)} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Presence</Text>
            <Text style={styles.stepSub}>Take 3 deep breaths. Observe the sensation without judgment.</Text>
            
            <View style={styles.lottiePlaceholder}>
              <Ionicons name="leaf" size={80} color={Colors.primary} />
            </View>
            
            <Button
              title="I am present"
              onPress={() => setStep(5)}
              style={styles.nextBtn}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Current Intensity</Text>
            <Text style={styles.stepSub}>How does the sensation feel after observing it?</Text>
            
            <View style={styles.intensityWrapper}>
              <Text style={styles.intensityNum}>{postIntensity}</Text>
              <View style={styles.sliderMock}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <TouchableOpacity 
                    key={n} 
                    onPress={() => setPostIntensity(n)}
                    style={[styles.sliderDot, postIntensity === n && styles.sliderDotActive]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(4)} variant="outline" style={styles.halfBtn} />
              <Button title="Compare" onPress={handleFinish} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Insight Created</Text>
            <Text style={styles.stepSub}>You've completed your body awareness mapping.</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Initial</Text>
                <Text style={styles.resultValue}>{preIntensity}</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Now</Text>
                <Text style={styles.resultValue}>{postIntensity}</Text>
              </View>
            </View>

            {improvement > 0 ? (
              <View style={styles.improvementBadge}>
                <Text style={styles.improvementText}>Distress reduced by {improvement}%</Text>
              </View>
            ) : (
              <View style={[styles.improvementBadge, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.improvementText, { color: Colors.textSecondary }]}>Awareness increased</Text>
              </View>
            )}

            <Button
              title="Save to Timeline"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.nextBtn}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Theme.spacing.lg, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: Theme.spacing.xl },
  backBtn: { marginBottom: Theme.spacing.md },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.secondary,
  },
  stepTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
    marginBottom: 8,
  },
  stepSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Theme.spacing.xl,
  },
  emotionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emotionChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  emotionText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  emotionTextSelected: {
    color: Colors.primary,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  regionChipSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '10',
  },
  regionText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  regionTextSelected: {
    color: Colors.secondary,
  },
  nextBtn: { marginTop: Theme.spacing.lg, borderRadius: Theme.borderRadius.lg },
  navRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.lg,
  },
  halfBtn: { flex: 1, borderRadius: Theme.borderRadius.lg },
  intensityWrapper: {
    alignItems: 'center',
    marginVertical: Theme.spacing.xl,
  },
  intensityNum: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 64,
    color: Colors.primary,
    marginBottom: Theme.spacing.xl,
  },
  sliderMock: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  lottiePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.xl,
  },
  resultRow: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
  },
  resultDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  improvementBadge: {
    backgroundColor: Colors.success + '15',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  improvementText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.success,
  },
});
