import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Questionnaire } from "@/components/screening/Questionnaire";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import {
  PHQ9_QUESTIONS,
  PHQ9_OPTIONS,
  PHQ9_INSTRUCTION,
  GAD7_QUESTIONS,
  GAD7_OPTIONS,
  GAD7_INSTRUCTION,
  PQ16_QUESTIONS,
  PQ16_OPTIONS,
  PQ16_INSTRUCTION,
  WSAS_QUESTIONS,
  WSAS_OPTIONS,
  WSAS_INSTRUCTION,
  REQOL10_QUESTIONS,
  REQOL10_OPTIONS,
  REQOL10_INSTRUCTION,
} from "@/constants/Screening";
import {
  scorePHQ9,
  scoreGAD7,
  scorePQ16,
  scoreWSAS,
  scoreReQoL10,
} from "@/utils/scoring";
import { runTriage, TriageInput } from "@/utils/triage";

const INSTRUMENTS = [
  {
    id: "phq9",
    title: "PHQ-9 (Depression)",
    desc: "Assess feelings of low mood, sleep, and energy levels.",
    questions: PHQ9_QUESTIONS,
    options: PHQ9_OPTIONS,
    instruction: PHQ9_INSTRUCTION,
    scoring: scorePHQ9,
  },
  {
    id: "gad7",
    title: "GAD-7 (Anxiety)",
    desc: "Evaluate levels of worry, tension, and nervousness.",
    questions: GAD7_QUESTIONS,
    options: GAD7_OPTIONS,
    instruction: GAD7_INSTRUCTION,
    scoring: scoreGAD7,
  },
  {
    id: "pq16",
    title: "PQ-16 (Experiences)",
    desc: "Screen for sensory perceptions and unusual experiences.",
    questions: PQ16_QUESTIONS,
    options: PQ16_OPTIONS,
    instruction: PQ16_INSTRUCTION,
    scoring: scorePQ16,
  },
  {
    id: "wsas",
    title: "WSAS (Functioning)",
    desc: "Measure how wellbeing affects daily tasks and work.",
    questions: WSAS_QUESTIONS,
    options: WSAS_OPTIONS,
    instruction: WSAS_INSTRUCTION,
    scoring: scoreWSAS,
  },
  {
    id: "reqol10",
    title: "ReQoL-10 (Quality of Life)",
    desc: "Examine general mental wellbeing and life quality.",
    questions: REQOL10_QUESTIONS,
    options: REQOL10_OPTIONS,
    instruction: REQOL10_INSTRUCTION,
    scoring: scoreReQoL10,
  },
];

type ScreeningState = Record<string, (number | null)[]>;

const SCREENING_STORE_KEY = "screening_progress";

export default function ScreeningScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ScreeningState>({
    phq9: new Array(PHQ9_QUESTIONS.length).fill(null),
    gad7: new Array(GAD7_QUESTIONS.length).fill(null),
    pq16: new Array(PQ16_QUESTIONS.length).fill(null),
    wsas: new Array(WSAS_QUESTIONS.length).fill(null),
    reqol10: new Array(REQOL10_QUESTIONS.length).fill(null),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load persisted progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const saved = await SecureStore.getItemAsync(SCREENING_STORE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ScreeningState;
          setAnswers(parsed);
        }
      } catch (e) {
        console.warn("[Screening] Failed to load persisted progress:", e);
      }
    }
    loadProgress();
  }, []);

  async function persistAnswers(nextAnswers: ScreeningState) {
    try {
      await SecureStore.setItemAsync(SCREENING_STORE_KEY, JSON.stringify(nextAnswers));
    } catch (e) {
      console.warn("[Screening] Failed to persist answers:", e);
    }
  }

  const submitScreening = useMutation(api.screening.submitScreening);
  const processTriage = useMutation(api.triage.processTriage);
  const markScreeningComplete = useMutation(api.users.markScreeningComplete);
  const scheduleFollowUp = useMutation(api.followUps.scheduleFollowUp);

  async function finishScreening() {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const phq9 = scorePHQ9(answers.phq9 as number[]);
      const gad7 = scoreGAD7(answers.gad7 as number[]);
      const pq16 = scorePQ16(answers.pq16 as number[]);
      const wsas = scoreWSAS(answers.wsas as number[]);
      const reqol10 = scoreReQoL10(answers.reqol10 as number[]);

      const triageInput: TriageInput = {
        phq9_total: phq9.total,
        gad7_total: gad7.total,
        pq16_total: pq16.total,
        wsas_total: wsas.total,
        reqol10_total: reqol10.total,
        phq9_item9_score: phq9.item9Score,
      };

      const triageResult = runTriage(triageInput);

      // 1. Save screening
      await submitScreening({
        userId: user.id,
        phq9_total: phq9.total,
        gad7_total: gad7.total,
        pq16_total: pq16.total,
        wsas_total: wsas.total,
        reqol10_total: reqol10.total,
        phq9_item9_flag: phq9.item9Flag,
        phq9_item9_score: phq9.item9Score,
      });

      // 2. Process Triage and Handle Alerts (Backend handled)
      const triage = await processTriage({
        userId: user.id,
        phq9_total: phq9.total,
        gad7_total: gad7.total,
        pq16_total: pq16.total,
        wsas_total: wsas.total,
        reqol10_total: reqol10.total,
        phq9_item9_score: phq9.item9Score,
      });

      // 3. Schedule Follow-up based on level
      await scheduleFollowUp({
        userId: user.id,
        level: triage.level,
      });

      // Mark complete on user
      await markScreeningComplete({ clerkId: user.id });

      // Delete cached progress
      try {
        await SecureStore.deleteItemAsync(SCREENING_STORE_KEY);
      } catch (e) {}

      // Go to app
      router.replace("/(auth)/(tabs)");
    } catch (error) {
      console.error("Failed to submit screening", error);
      setIsSubmitting(false);
    }
  }

  const getProgress = (instId: string, questionsLength: number) => {
    const instAnswers = answers[instId] || [];
    const answered = instAnswers.filter((a) => a !== null).length;
    const percent = Math.round((answered / questionsLength) * 100);
    return { answered, percent };
  };

  const allCompleted = INSTRUMENTS.every((inst) => {
    const instAnswers = answers[inst.id] || [];
    return instAnswers.every((a) => a !== null);
  });

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing your responses...</Text>
      </View>
    );
  }

  if (selectedInstrument) {
    const instrument = INSTRUMENTS.find((inst) => inst.id === selectedInstrument);
    if (!instrument) return null;

    return (
      <View style={styles.container}>
        <Questionnaire
          title={instrument.title}
          instruction={instrument.instruction}
          questions={instrument.questions}
          options={instrument.options}
          initialAnswers={answers[selectedInstrument]}
          onAnswerChange={(newAnswers) => {
            const nextAnswers = { ...answers, [selectedInstrument]: newAnswers };
            setAnswers(nextAnswers);
            persistAnswers(nextAnswers);
          }}
          onComplete={(completedAnswers) => {
            const nextAnswers = { ...answers, [selectedInstrument]: completedAnswers };
            setAnswers(nextAnswers);
            persistAnswers(nextAnswers);
            setSelectedInstrument(null);
          }}
          onBack={() => setSelectedInstrument(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clinical Screening</Text>
        <Text style={styles.headerSubtitle}>
          Complete all 5 assessments below to unlock your clinical dashboard and personalized insights.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {INSTRUMENTS.map((inst) => {
            const { answered, percent } = getProgress(inst.id, inst.questions.length);
            const isFinished = percent === 100;
            const isStarted = percent > 0;

            return (
              <TouchableOpacity
                key={inst.id}
                style={[
                  styles.card,
                  isFinished && styles.cardFinished,
                  isStarted && !isFinished && styles.cardInProgress,
                ]}
                onPress={() => setSelectedInstrument(inst.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{inst.title}</Text>
                    <Text style={styles.cardDesc}>{inst.desc}</Text>
                  </View>
                  <View style={styles.statusIcon}>
                    {isFinished ? (
                      <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
                    ) : isStarted ? (
                      <Ionicons name="time-outline" size={26} color={Colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={26} color="#CBD5E1" />
                    )}
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>
                      {isFinished ? "Completed" : isStarted ? "In Progress" : "Not Started"}
                    </Text>
                    <Text style={styles.progressPercent}>{percent}% ({answered}/{inst.questions.length})</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !allCompleted && styles.submitButtonDisabled]}
          onPress={() => finishScreening()}
          disabled={!allCompleted}
        >
          <Text style={styles.submitButtonText}>Submit Entire Assessment</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: Theme.spacing.lg,
  },
  headerTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: 140,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Theme.shadows.tertiary,
  },
  cardFinished: {
    borderColor: '#10B981' + '40',
    backgroundColor: '#F0FDF4',
  },
  cardInProgress: {
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '05',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  cardInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  cardTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.xl,
    paddingBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Theme.shadows.tertiary,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: Colors.white,
  },
});
