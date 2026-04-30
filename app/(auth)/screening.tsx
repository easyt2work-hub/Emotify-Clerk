import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Questionnaire } from "@/components/screening/Questionnaire";
import {
  SCREENING_ORDER,
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

type ScreeningState = Record<string, number[]>;

export default function ScreeningScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<ScreeningState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitScreening = useMutation(api.screening.submitScreening);
  const processTriage = useMutation(api.triage.processTriage);
  const markScreeningComplete = useMutation(api.users.markScreeningComplete);
  const scheduleFollowUp = useMutation(api.followUps.scheduleFollowUp);

  const currentInstrument = SCREENING_ORDER[currentStepIndex];

  async function handleComplete(instrumentAnswers: number[]) {
    const newAnswers = { ...answers, [currentInstrument]: instrumentAnswers };
    setAnswers(newAnswers);

    if (currentStepIndex < SCREENING_ORDER.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      await finishScreening(newAnswers);
    }
  }

  function handleBack() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }

  async function finishScreening(finalAnswers: ScreeningState) {
    if (!clerkUser) return;
    setIsSubmitting(true);

    try {
      const phq9 = scorePHQ9(finalAnswers.phq9 || []);
      const gad7 = scoreGAD7(finalAnswers.gad7 || []);
      const pq16 = scorePQ16(finalAnswers.pq16 || []);
      const wsas = scoreWSAS(finalAnswers.wsas || []);
      const reqol10 = scoreReQoL10(finalAnswers.reqol10 || []);

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
        userId: clerkUser.id,
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
        userId: clerkUser.id,
        phq9_total: phq9.total,
        gad7_total: gad7.total,
        pq16_total: pq16.total,
        wsas_total: wsas.total,
        reqol10_total: reqol10.total,
        phq9_item9_score: phq9.item9Score,
      });

      // 3. Schedule Follow-up based on level
      await scheduleFollowUp({
        userId: clerkUser.id,
        level: triage.level,
      });

      // Mark complete on user
      await markScreeningComplete({ clerkId: clerkUser.id });

      // Go to app
      router.replace("/(auth)/(tabs)");
    } catch (error) {
      console.error("Failed to submit screening", error);
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing your responses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentInstrument === "phq9" && (
        <Questionnaire
          title="PHQ-9 (Depression)"
          instruction={PHQ9_INSTRUCTION}
          questions={PHQ9_QUESTIONS}
          options={PHQ9_OPTIONS}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
      {currentInstrument === "gad7" && (
        <Questionnaire
          title="GAD-7 (Anxiety)"
          instruction={GAD7_INSTRUCTION}
          questions={GAD7_QUESTIONS}
          options={GAD7_OPTIONS}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
      {currentInstrument === "pq16" && (
        <Questionnaire
          title="PQ-16 (Experiences)"
          instruction={PQ16_INSTRUCTION}
          questions={PQ16_QUESTIONS}
          options={PQ16_OPTIONS}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
      {currentInstrument === "wsas" && (
        <Questionnaire
          title="WSAS (Functioning)"
          instruction={WSAS_INSTRUCTION}
          questions={WSAS_QUESTIONS}
          options={WSAS_OPTIONS}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
      {currentInstrument === "reqol10" && (
        <Questionnaire
          title="ReQoL-10 (Quality of Life)"
          instruction={REQOL10_INSTRUCTION}
          questions={REQOL10_QUESTIONS}
          options={REQOL10_OPTIONS}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
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
});
