import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Theme } from '@/constants/Theme';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import type { ScreeningQuestion, ScreeningOption } from '@/constants/Screening';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuestionnaireProps {
  title: string;
  instruction: string;
  questions: ScreeningQuestion[];
  options: ScreeningOption[];
  onComplete: (answers: number[]) => void;
  onBack?: () => void;
  initialAnswers?: (number | null)[];
  onAnswerChange?: (answers: (number | null)[]) => void;
}

export function Questionnaire({
  title,
  instruction,
  questions,
  options,
  onComplete,
  onBack,
  initialAnswers,
  onAnswerChange,
}: QuestionnaireProps) {
  // Find first unanswered question to restore progress
  const initialIndex = initialAnswers ? initialAnswers.findIndex(a => a === null) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [answers, setAnswers] = useState<(number | null)[]>(() => initialAnswers || new Array(questions.length).fill(null));

  const currentQuestion = questions[currentIndex];
  const selectedValue = answers[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  function selectOption(value: number) {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
    if (onAnswerChange) {
      onAnswerChange(newAnswers);
    }
    // No auto-advance: user must tap "Next Question" to proceed
  }

  function goNext() {
    if (isLastQuestion && allAnswered) {
      onComplete(answers as number[]);
    } else if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (onBack) {
      onBack();
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={goPrev} style={styles.miniBackBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.instruction}>{instruction}</Text>

          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>QUESTION {currentIndex + 1} OF {questions.length}</Text>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          </View>
        </View>

        <View style={styles.optionsList}>
          {options.map((option, index) => (
            <View key={option.value}>
              <TouchableOpacity
                onPress={() => selectOption(option.value)}
                style={[
                  styles.optionBtn,
                  selectedValue === option.value && styles.optionBtnSelected,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selectedValue === option.value && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <View style={[styles.radio, selectedValue === option.value && styles.radioSelected]}>
                  {selectedValue === option.value && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isLastQuestion ? (
          <Button
            title="Finish Assessment"
            onPress={goNext}
            disabled={!allAnswered}
            style={styles.submitBtn}
          />
        ) : (
          <Button
            title="Next Question"
            onPress={goNext}
            disabled={selectedValue === null}
            variant="outline"
            style={styles.nextBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  miniBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.tertiary,
  },
  headerTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: Colors.text,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 120,
  },
  instruction: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Theme.shadows.tertiary,
  },
  questionLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  questionText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 30,
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Theme.shadows.tertiary,
  },
  optionBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  optionLabel: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.primary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.lg,
    paddingBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  nextBtn: {
    height: 56,
    borderRadius: 28,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
  },
});
