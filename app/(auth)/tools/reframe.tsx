import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const THINKING_TRAPS_LIST = [
  {
    id: "all_or_nothing",
    label: "All-or-nothing",
    description: "I see things only as perfect or a disaster."
  },
  {
    id: "over_worry",
    label: "Over-worry",
    description: "I keep replaying this worry in my head."
  },
  {
    id: "guessing_others_thoughts",
    label: "Guessing others' thoughts",
    description: "I assume I know what others think."
  },
  {
    id: "worst_case",
    label: "Worst-case thinking",
    description: "I jump to the worst possible outcome."
  },
  {
    id: "blame_self",
    label: "Blame self too much",
    description: "I take all the fault even if it's not only me."
  },
  {
    id: "only_sees_bad",
    label: "Only-sees-bad",
    description: "I notice only the negative things."
  },
  {
    id: "must_should",
    label: "Must/should pressure",
    description: "I tell myself I must be perfect."
  },
  {
    id: "name_calling",
    label: "Name-calling",
    description: "I label myself with harsh words."
  },
  {
    id: "predicting_doom",
    label: "Predicting doom",
    description: "I act like I can see the future."
  },
  {
    id: "constant_comparing",
    label: "Constant comparing",
    description: "I compare myself to others all the time."
  }
];

const CHALLENGE_QUESTIONS: Record<string, string[]> = {
  all_or_nothing: [
    "Is there a middle ground?",
    "Does this situation have to be perfect?",
    "What parts went okay?",
    "What would success look like if it wasn't perfect?",
    "Am I being too harsh on myself?"
  ],
  over_worry: [
    "Does thinking about this repeatedly help solve it?",
    "What can I control right now?",
    "What is one small action I can take?",
    "How can I gently shift my focus to the present?",
    "Am I overestimating the likelihood of this worry?"
  ],
  guessing_others_thoughts: [
    "What proof do I actually have?",
    "Could there be another explanation?",
    "Has this person actually said this?",
    "Am I making assumptions?",
    "What facts do I know for certain?"
  ],
  worst_case: [
    "What evidence do I have that this will definitely happen?",
    "What is another possible outcome?",
    "If the worst happened, how would I cope?",
    "Has something similar happened before?",
    "What would I tell a friend in this situation?"
  ],
  blame_self: [
    "What other factors played a role in this?",
    "Am I taking responsibility for things I cannot control?",
    "If a friend was in my place, would I blame them?",
    "What part of this is genuinely my responsibility?",
    "What can I learn from this instead of feeling guilty?"
  ],
  only_sees_bad: [
    "What is one positive or neutral thing about this?",
    "Are there any silver linings, no matter how small?",
    "What would someone else say is good or okay here?",
    "Am I ignoring progress I have already made?",
    "How can I balance this negative focus?"
  ],
  must_should: [
    "Where did this 'must' or 'should' rule come from?",
    "Is this rule realistic and helpful?",
    "What happens if I don't follow this rule perfectly?",
    "Can I change my 'should' into a 'would like to'?",
    "How can I show myself more kindness?"
  ],
  name_calling: [
    "Is this label completely true in all areas of my life?",
    "What would a kind person say about me instead?",
    "Does one mistake define who I am?",
    "How does using this label make me feel?",
    "What is a more respectful way to describe my action?"
  ],
  predicting_doom: [
    "Can I actually see the future?",
    "Has a prediction of doom ever turned out okay before?",
    "What are the realistic odds of this doom happening?",
    "How does predicting doom affect my actions today?",
    "What is a more hopeful prediction I can make?"
  ],
  constant_comparing: [
    "Am I comparing my inside feelings to their outside appearance?",
    "Is this a fair and helpful comparison?",
    "What are my own unique strengths?",
    "How can I focus on my own path instead of theirs?",
    "What is one thing I appreciate about myself today?"
  ]
};

const SUCCESS_MESSAGES = [
  "Great — that was a solid reframe.",
  "Every reframe helps your mind learn a calmer habit.",
  "You practiced a healthier way of thinking today."
];

const getIntensityLabel = (value: number) => {
  if (value <= 2) return { text: "Minimal", desc: "Barely noticeable, very mild presence.", color: '#10B981' };
  if (value <= 4) return { text: "Mild", desc: "Noticeable but easily managed.", color: '#3B82F6' };
  if (value <= 6) return { text: "Moderate", desc: "Distracting, but you can still function.", color: '#F59E0B' };
  if (value <= 8) return { text: "Severe", desc: "Strong distress, hard to ignore.", color: '#EA580C' };
  return { text: "Extreme", desc: "Overwhelming distress, demands intervention.", color: '#EF4444' };
};

interface IntensitySelectorProps {
  value: number;
  onChange: (val: number) => void;
  activeColor?: string;
}

function IntensitySelector({ value, onChange, activeColor }: IntensitySelectorProps) {
  const level = getIntensityLabel(value);
  
  const handleDecrement = () => {
    if (value > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < 10) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(value + 1);
    }
  };

  const handleSelect = (n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onChange(n);
  };

  const renderCircle = (n: number) => {
    const isSelected = value === n;
    const numLevel = getIntensityLabel(n || 1);
    return (
      <TouchableOpacity
        key={n}
        onPress={() => handleSelect(n)}
        style={[
          styles.gridCircle,
          isSelected 
            ? { 
                backgroundColor: numLevel.color, 
                borderColor: numLevel.color,
                shadowColor: numLevel.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4
              }
            : styles.gridCircleUnselected
        ]}
      >
        <Text 
          style={[
            styles.gridCircleText,
            { color: isSelected ? Colors.white : Colors.textSecondary }
          ]}
        >
          {n}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.selectorContainer}>
      <View style={styles.stepperRow}>
        <TouchableOpacity 
          onPress={handleDecrement} 
          style={[styles.stepperBtn, value === 0 && styles.stepperBtnDisabled]}
          disabled={value === 0}
        >
          <Ionicons name="remove" size={24} color={value === 0 ? Colors.textMuted : (activeColor || Colors.primary)} />
        </TouchableOpacity>
        
        <View style={styles.valueDisplay}>
          <Text style={[styles.intensityNum, { color: level.color }]}>{value}</Text>
          <View style={[styles.badgeContainer, { backgroundColor: level.color }]}>
            <Text style={styles.badgeText}>{level.text}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleIncrement} 
          style={[styles.stepperBtn, value === 10 && styles.stepperBtnDisabled]}
          disabled={value === 10}
        >
          <Ionicons name="add" size={24} color={value === 10 ? Colors.textMuted : (activeColor || Colors.primary)} />
        </TouchableOpacity>
      </View>

      <View style={styles.descCard}>
        <Text style={styles.intensityDesc}>{level.desc}</Text>
      </View>

      <View style={styles.intensityGrid}>
        <View style={styles.gridRow}>
          {[0, 1, 2, 3, 4, 5].map((n) => renderCircle(n))}
        </View>
        <View style={styles.gridRow}>
          {[6, 7, 8, 9, 10].map((n) => renderCircle(n))}
        </View>
      </View>
    </View>
  );
}

export default function ReframeScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  
  const latestTriage = useQuery(api.triage.getLatest, {
    userId: user?.id ?? "",
  });
  
  const createReframeLog = useMutation(api.reframes.createLog);
  const createCounsellorRequest = useMutation(api.counsellorRequests.create);

  const [step, setStep] = useState(1);
  const [situationText, setSituationText] = useState("");
  const [thoughtOriginal, setThoughtOriginal] = useState("");
  const [preReframeIntensity, setPreReframeIntensity] = useState(5);
  const [thinkingTrapChoice, setThinkingTrapChoice] = useState("");
  
  // Step 5 Question indexing
  const [questionIndex, setQuestionIndex] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(["", "", "", "", ""]);
  
  const [reframeText, setReframeText] = useState("");
  const [postReframeIntensity, setPostReframeIntensity] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCounsellorRequesting, setIsCounsellorRequesting] = useState(false);

  // Pick a random success message on mount
  useEffect(() => {
    const randomMsg = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
    setSuccessMessage(randomMsg);
  }, []);

  const insets = useSafeAreaInsets();

  if (latestTriage === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Personalization Safety Gate Check
  const isSevere = latestTriage && ["severe", "suicide_flag", "psychosis_flag"].includes(latestTriage.level);

  const handleRequestCounsellor = async () => {
    if (!user) return;
    setIsCounsellorRequesting(true);
    try {
      await createCounsellorRequest({
        user_id: user.id,
        thought_original: thoughtOriginal || undefined,
        situation_text: situationText || undefined,
        timestamp: Date.now(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Request Submitted",
        "A counsellor has been requested and will reach out to you shortly.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit counsellor request. Please try again.");
    } finally {
      setIsCounsellorRequesting(false);
    }
  };

  if (isSevere) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#F4F3FF', '#E0DBFF']} style={StyleSheet.absoluteFill} />
        <View style={[styles.content, { paddingTop: Math.max(40, insets.top) }]}>
          <Text style={styles.title}>Counsellor Support</Text>
          <View style={styles.glassCard}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.primary} style={{ marginBottom: Theme.spacing.lg }} />
            <Text style={styles.safetyGateText}>
              Because your daily life seems heavily affected, it's best to use this tool with a counsellor.
            </Text>
            
            <Button 
              title="Request Counsellor Session" 
              onPress={handleRequestCounsellor} 
              loading={isCounsellorRequesting}
              style={{ ...styles.actionBtn, marginTop: Theme.spacing.lg }} 
            />
            <Button 
              title="Go Back" 
              variant="outline"
              onPress={() => router.back()} 
              style={{ ...styles.actionBtnOutline, marginTop: Theme.spacing.md }} 
              textStyle={{ color: Colors.primary }}
            />
          </View>
        </View>
      </View>
    );
  }

  const handleNextQuestion = () => {
    if (questionIndex < 4) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setStep(6);
    }
  };

  const handleBackQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else {
      setStep(4);
    }
  };

  const handleSaveReframe = async (saveFlag: boolean) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const preInt = preReframeIntensity;
      const postInt = postReframeIntensity;
      const diff = preInt - postInt;
      const improvement = preInt > 0 ? Math.round((diff / preInt) * 100) : 0;

      await createReframeLog({
        userId: user.id,
        situation_text: situationText,
        thought_original: thoughtOriginal,
        thinking_trap_choice: thinkingTrapChoice,
        guided_answers: guidedAnswers,
        reframe_text: reframeText,
        pre_reframe_intensity: preInt,
        post_reframe_intensity: postInt,
        improvement_percentage: improvement,
        saved_reframe_flag: saveFlag,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(9); // Success page
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save your reframe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImprovementPercentage = () => {
    const diff = preReframeIntensity - postReframeIntensity;
    return preReframeIntensity > 0 ? Math.round((diff / preReframeIntensity) * 100) : 0;
  };

  const activeQuestions = CHALLENGE_QUESTIONS[thinkingTrapChoice] || CHALLENGE_QUESTIONS.all_or_nothing;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F4F3FF', '#E0DBFF']} style={StyleSheet.absoluteFill} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(30, insets.top),
              paddingBottom: Math.max(30, insets.bottom + 20),
            }
          ]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Reframe Now</Text>
            
            {step < 9 && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(step / 8) * 100}%` }]} />
              </View>
            )}
          </View>

          {/* STEP 1: Situation */}
          {step === 1 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>What happened?</Text>
              <Text style={styles.stepSub}>Tell me briefly what happened or what situation is bothering you.</Text>
              
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={situationText}
                onChangeText={setSituationText}
                placeholder="e.g. My manager criticized my work..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
              
              <Button 
                title="Continue" 
                onPress={() => setStep(2)} 
                disabled={!situationText.trim()} 
                style={styles.actionBtn} 
              />
            </View>
          )}

          {/* STEP 2: Exact Thought */}
          {step === 2 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>What thought went through your mind?</Text>
              <Text style={styles.stepSub}>Write the exact sentence that appeared in your head.</Text>
              
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={thoughtOriginal}
                onChangeText={setThoughtOriginal}
                placeholder="e.g. I always mess things up."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
              
              <View style={styles.navRow}>
                <Button title="Back" onPress={() => setStep(1)} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Continue" onPress={() => setStep(3)} disabled={!thoughtOriginal.trim()} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 3: Pre Intensity */}
          {step === 3 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>How strong does this feeling feel?</Text>
              <Text style={styles.stepSub}>Rate it from 0 to 10.</Text>
              
              <IntensitySelector 
                value={preReframeIntensity} 
                onChange={setPreReframeIntensity} 
                activeColor={Colors.primary}
              />

              <View style={styles.navRow}>
                <Button title="Back" onPress={() => setStep(2)} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Continue" onPress={() => setStep(4)} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 4: Thinking Traps */}
          {step === 4 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Does this thought contain a thinking trap?</Text>
              <Text style={styles.stepSub}>Choose the option that fits best.</Text>
              
              <ScrollView style={styles.trapScroll} showsVerticalScrollIndicator={false}>
                {THINKING_TRAPS_LIST.map((trap) => {
                  const isSelected = thinkingTrapChoice === trap.id;
                  return (
                    <TouchableOpacity
                      key={trap.id}
                      activeOpacity={0.8}
                      onPress={() => setThinkingTrapChoice(trap.id)}
                      style={[
                        styles.trapCard,
                        isSelected && styles.trapCardSelected
                      ]}
                    >
                      <Text style={[styles.trapCardTitle, isSelected && { color: Colors.primary }]}>{trap.label}</Text>
                      <Text style={styles.trapCardDesc}>{trap.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.navRow}>
                <Button title="Back" onPress={() => setStep(3)} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Continue" onPress={() => { setStep(5); setQuestionIndex(0); }} disabled={!thinkingTrapChoice} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 5: Guided Questions */}
          {step === 5 && (
            <View style={styles.glassCard}>
              <Text style={styles.questionProgress}>Question {questionIndex + 1} of 5</Text>
              <Text style={styles.questionTitle}>{activeQuestions[questionIndex]}</Text>
              
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={guidedAnswers[questionIndex]}
                onChangeText={(val) => {
                  const updated = [...guidedAnswers];
                  updated[questionIndex] = val;
                  setGuidedAnswers(updated);
                }}
                placeholder="Write your reflection here..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />

              <View style={styles.navRow}>
                <Button title="Back" onPress={handleBackQuestion} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Next" onPress={handleNextQuestion} disabled={!guidedAnswers[questionIndex].trim()} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 6: Create New Thought */}
          {step === 6 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Try a New Thought</Text>
              <Text style={styles.stepSub}>Using your answers, write a kinder and more realistic thought.</Text>
              
              <View style={styles.oldThoughtBox}>
                <Text style={styles.oldThoughtLabel}>Old Thought:</Text>
                <Text style={styles.oldThoughtText}>"{thoughtOriginal}"</Text>
              </View>

              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={reframeText}
                onChangeText={setReframeText}
                placeholder="e.g. My manager pointed out a specific mistake, but they also praised my contribution last week."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />

              <View style={styles.navRow}>
                <Button title="Back" onPress={() => { setStep(5); setQuestionIndex(4); }} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Continue" onPress={() => setStep(7)} disabled={!reframeText.trim()} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 7: Rate Post Intensity */}
          {step === 7 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>How strong does the feeling feel now?</Text>
              <Text style={styles.stepSub}>Rate the feeling again.</Text>

              <IntensitySelector 
                value={postReframeIntensity} 
                onChange={setPostReframeIntensity} 
                activeColor={Colors.primary}
              />

              <View style={styles.navRow}>
                <Button title="Back" onPress={() => setStep(6)} variant="outline" style={styles.halfBtn} textStyle={{ color: Colors.primary }} />
                <Button title="Continue" onPress={() => setStep(8)} style={styles.halfBtn} />
              </View>
            </View>
          )}

          {/* STEP 8: Save Prompt */}
          {step === 8 && (
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Save Reframe?</Text>
              <Text style={styles.stepSub}>Would you like to save this reframe for future reference?</Text>
              
              <Button 
                title="Save Reframe" 
                onPress={() => handleSaveReframe(true)} 
                loading={isSubmitting}
                style={styles.actionBtn} 
              />
              <Button 
                title="Skip" 
                variant="outline"
                onPress={() => handleSaveReframe(false)} 
                loading={isSubmitting}
                style={{ ...styles.actionBtnOutline, marginTop: Theme.spacing.md }} 
                textStyle={{ color: Colors.primary }}
              />
            </View>
          )}

          {/* STEP 9: Success Screen */}
          {step === 9 && (
            <View style={styles.glassCard}>
              <View style={styles.successIconWrapper}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
              </View>
              <Text style={styles.stepTitle}>Reframe Complete</Text>
              <Text style={styles.encouragingText}>"{successMessage}"</Text>

              <View style={styles.summaryResultCard}>
                <Text style={styles.resultPercentage}>
                  {getImprovementPercentage() > 0 ? `${getImprovementPercentage()}%` : '0%'}
                </Text>
                <Text style={styles.resultLabel}>Tension Reduction</Text>
                
                <View style={styles.resultDetailRow}>
                  <Text style={styles.resultVal}>{preReframeIntensity}/10 before</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
                  <Text style={styles.resultVal}>{postReframeIntensity}/10 after</Text>
                </View>
              </View>

              <Button 
                title="View Saved Reframes" 
                onPress={() => router.replace({ pathname: "/(auth)/tools/saved-reframes" }) as any} 
                style={styles.actionBtn} 
              />
              <Button 
                title="Back to Dashboard" 
                variant="outline"
                onPress={() => router.replace("/(auth)/(tabs)") as any} 
                style={{ ...styles.actionBtnOutline, marginTop: Theme.spacing.md }} 
                textStyle={{ color: Colors.primary }}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F3FF',
  },
  content: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#EBE9FE',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: Theme.spacing.lg,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    alignItems: 'center',
  },
  stepTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#FAF9FF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E8E5FF',
    padding: Theme.spacing.md,
    color: Colors.text,
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    minHeight: 120,
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  actionBtn: {
    width: '100%',
    borderRadius: Theme.borderRadius.lg,
    height: 56,
  },
  actionBtnOutline: {
    width: '100%',
    borderRadius: Theme.borderRadius.lg,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  navRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    width: '100%',
  },
  halfBtn: {
    flex: 1,
    borderRadius: Theme.borderRadius.lg,
    height: 52,
  },
  selectorContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    width: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE9FE',
    ...Theme.shadows.tertiary,
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  valueDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  intensityNum: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 64,
    lineHeight: 70,
  },
  badgeContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 2,
    ...Theme.shadows.tertiary,
  },
  badgeText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descCard: {
    backgroundColor: 'rgba(244, 243, 255, 0.6)',
    borderRadius: 16,
    padding: Theme.spacing.md,
    width: '100%',
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(235, 233, 254, 0.5)',
  },
  intensityDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm - 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  intensityGrid: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
  },
  gridCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleUnselected: {
    backgroundColor: '#FAF9FF',
    borderColor: '#E8E5FF',
  },
  gridCircleText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
  },
  trapScroll: {
    maxHeight: 280,
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  trapCard: {
    backgroundColor: '#FAF9FF',
    borderWidth: 1.5,
    borderColor: '#E8E5FF',
    borderRadius: 16,
    padding: Theme.spacing.md,
    marginBottom: 10,
    width: '100%',
  },
  trapCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  trapCardTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: 4,
  },
  trapCardDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  questionProgress: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xs,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  questionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  oldThoughtBox: {
    backgroundColor: '#F1F0FF',
    borderRadius: 16,
    padding: Theme.spacing.md,
    width: '100%',
    marginBottom: Theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  oldThoughtLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  oldThoughtText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  safetyGateText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.lg,
  },
  successIconWrapper: {
    marginBottom: Theme.spacing.md,
  },
  encouragingText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    fontStyle: 'italic',
  },
  summaryResultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: Theme.spacing.xl,
  },
  resultPercentage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 54,
    color: Colors.primary,
  },
  resultLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultVal: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
  },
});
