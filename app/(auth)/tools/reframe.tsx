import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { THINKING_TRAPS, REFRAME_GUIDED_QUESTIONS } from "@/constants/Screening";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { REINFORCEMENT_MESSAGES } from "@/constants/Wellness";

const { width } = Dimensions.get('window');

export default function ReframeScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  
  const latestTriage = useQuery(api.triage.getLatest, {
    userId: clerkUser?.id ?? "",
  });
  const createReframe = useMutation(api.reframes.create);

  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState("");
  const [originalThought, setOriginalThought] = useState("");
  const [thinkingTrap, setThinkingTrap] = useState("");
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(new Array(REFRAME_GUIDED_QUESTIONS.length).fill(""));
  const [newThought, setNewThought] = useState("");
  const [preIntensity, setPreIntensity] = useState(5);
  const [postIntensity, setPostIntensity] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (latestTriage === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Personalization rule: restrict if severe
  if (latestTriage && ["severe", "suicide_flag", "psychosis_flag"].includes(latestTriage.level)) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Reframe Tool</Text>
          <View style={styles.alertCard}>
            <Ionicons name="warning-outline" size={48} color={Colors.warning} style={{ marginBottom: 16 }} />
            <Text style={styles.alertText}>
              This cognitive tool requires high concentration. 
              We recommend trying the JPMR relaxation or a MicroGoal instead during high distress.
            </Text>
            <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: Theme.spacing.lg, width: '100%' }} />
          </View>
        </View>
      </View>
    );
  }

  async function handleSubmit() {
    if (!clerkUser) return;
    setIsSubmitting(true);
    try {
      await createReframe({
        userId: clerkUser.id,
        situation,
        originalThought,
        thinkingTrap,
        guidedAnswers,
        newThought,
        preIntensity,
        postIntensity,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const randomMessage = REINFORCEMENT_MESSAGES[Math.floor(Math.random() * REINFORCEMENT_MESSAGES.length)];
      Alert.alert("Thought Reframed! 🧠", randomMessage, [{ text: "Done", onPress: () => router.back() }]);
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Cognitive Reframe</Text>
          <Progress />
        </View>

        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>The Situation</Text>
            <Text style={styles.stepSub}>Briefly describe what happened.</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={situation}
              onChangeText={setSituation}
              placeholder="e.g. A friend didn't reply to my message..."
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Initial Distress ({preIntensity}/10)</Text>
            <View style={styles.sliderMock}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity 
                  key={n} 
                  onPress={() => setPreIntensity(n)}
                  style={[styles.sliderDot, preIntensity === n && styles.sliderDotActive]}
                />
              ))}
            </View>
            <Button title="Continue" onPress={() => setStep(2)} disabled={!situation.trim()} style={styles.nextBtn} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>The Thought</Text>
            <Text style={styles.stepSub}>What did this situation make you think?</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={originalThought}
              onChangeText={setOriginalThought}
              placeholder="e.g. They are avoiding me or I did something wrong..."
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(1)} variant="outline" style={styles.halfBtn} />
              <Button title="Next" onPress={() => setStep(3)} disabled={!originalThought.trim()} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Identify Traps</Text>
            <Text style={styles.stepSub}>Is there a thinking trap here?</Text>
            <ScrollView style={styles.trapScroll} showsVerticalScrollIndicator={false}>
              {THINKING_TRAPS.map(trap => (
                <TouchableOpacity 
                  key={trap.id} 
                  style={[styles.trapItem, thinkingTrap === trap.id && styles.trapItemSelected]}
                  onPress={() => setThinkingTrap(trap.id)}
                >
                  <Text style={[styles.trapLabel, thinkingTrap === trap.id && styles.trapTextSelected]}>{trap.label}</Text>
                  <Text style={[styles.trapDesc, thinkingTrap === trap.id && styles.trapTextSelected]}>{trap.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(2)} variant="outline" style={styles.halfBtn} />
              <Button title="Next" onPress={() => setStep(4)} disabled={!thinkingTrap} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Challenge It</Text>
            <Text style={styles.stepSub}>{REFRAME_GUIDED_QUESTIONS[0]}</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={guidedAnswers[0]}
              onChangeText={(text) => {
                const newAnswers = [...guidedAnswers];
                newAnswers[0] = text;
                setGuidedAnswers(newAnswers);
              }}
              placeholder="Your reflection..."
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(3)} variant="outline" style={styles.halfBtn} />
              <Button title="Next" onPress={() => setStep(5)} disabled={!guidedAnswers[0].trim()} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Balanced Thought</Text>
            <Text style={styles.stepSub}>Rewrite the thought more realistically.</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={newThought}
              onChangeText={setNewThought}
              placeholder="e.g. They might be busy or forgot their phone..."
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.navRow}>
              <Button title="Back" onPress={() => setStep(4)} variant="outline" style={styles.halfBtn} />
              <Button title="Next" onPress={() => setStep(6)} disabled={!newThought.trim()} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>New Intensity</Text>
            <Text style={styles.stepSub}>How does the thought feel now?</Text>
            
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
              <Button title="Back" onPress={() => setStep(5)} variant="outline" style={styles.halfBtn} />
              <Button title="Complete" onPress={handleSubmit} loading={isSubmitting} style={styles.halfBtn} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    ...Theme.shadows.medium,
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
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    color: Colors.text,
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
  },
  sliderMock: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  sliderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  sliderDotActive: {
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  nextBtn: { marginTop: Theme.spacing.lg, borderRadius: Theme.borderRadius.lg },
  navRow: { flexDirection: 'row', gap: Theme.spacing.md, marginTop: Theme.spacing.lg },
  halfBtn: { flex: 1, borderRadius: Theme.borderRadius.lg },
  trapScroll: { maxHeight: 300, marginBottom: Theme.spacing.md },
  trapItem: {
    backgroundColor: Colors.background,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  trapItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  trapLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: 4,
  },
  trapDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trapTextSelected: { color: Colors.primary },
  intensityWrapper: { alignItems: 'center', marginVertical: Theme.spacing.xl },
  intensityNum: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 64,
    color: Colors.primary,
    marginBottom: Theme.spacing.xl,
  },
  alertCard: {
    backgroundColor: Colors.white,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  alertText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
