import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Modal, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { generateMicroGoals, MicroGoal } from "@/utils/microgoals";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const COMMUNITY_PHRASES = [
  "28 students completed a calm action today.",
  "Your campus earned 850 Calm Points this week.",
  "Many people are building healthier habits right now."
];

const COMPLETED_CONGRATS = [
  "Nice! Small wins stack up.",
  "You did it. Your brain likes routine.",
  "Every tiny step matters.",
  "Great job showing up for yourself.",
  "You've just trained your mind to choose calm."
];

const MISSED_ENCOURAGEMENTS = [
  "It's okay. Try now for just 2 minutes.",
  "Missed today? No problem. Small steps still count.",
  "Consistency beats perfection.",
  "You can always begin again.",
  "Want a quick breathing break instead?"
];

const BADGES_DEFINITIONS = [
  { id: "first_step", name: "First Step", desc: "Complete First Goal", icon: "footsteps-outline", color: "#10B981" },
  { id: "consistent", name: "Consistent", desc: "7 Day Streak", icon: "flame-outline", color: "#EF4444" },
  { id: "calm_builder", name: "Calm Builder", desc: "100 Points Earned", icon: "ribbon-outline", color: "#F59E0B" },
  { id: "strong_habit", name: "Strong Habit", desc: "30 Goals Completed", icon: "heart-outline", color: "#EC4899" },
  { id: "momentum_master", name: "Momentum Master", desc: "50 Goals Completed", icon: "trophy-outline", color: "#8B5CF6" }
];

export default function MicroGoalsScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const insets = useSafeAreaInsets();
  const todayStr = new Date().toISOString().split('T')[0];

  // Convex Queries
  const latestScreening = useQuery(api.screening.getLatest, { userId: user?.id ?? "" });
  const latestTriage = useQuery(api.triage.getLatest, { userId: user?.id ?? "" });
  const dailyGoals = useQuery(api.microGoals.getTodayGoals, { userId: user?.id ?? "" });
  const totalPoints = useQuery(api.microGoals.getPoints, { userId: user?.id ?? "" });
  const streakInfo = useQuery(api.microGoals.getStreak, { userId: user?.id ?? "" });
  const badgesEarned = useQuery(api.microGoals.getBadges, { userId: user?.id ?? "" });
  const weeklySummary = useQuery(api.microGoals.getWeeklySummary, { userId: user?.id ?? "" });
  const goalHistory = useQuery(api.microGoals.getGoalHistory, { userId: user?.id ?? "" });

  // Convex Mutations
  const createGoal = useMutation(api.microGoals.createGoal);
  const scheduleGoal = useMutation(api.microGoals.scheduleGoal);
  const completeGoal = useMutation(api.microGoals.completeGoal);
  const skipGoal = useMutation(api.microGoals.skipGoal);
  const rescheduleGoal = useMutation(api.microGoals.rescheduleGoal);

  // Layout states
  const [activeView, setActiveView] = useState<"dashboard" | "history">("dashboard");
  const [selectedGoal, setSelectedGoal] = useState<MicroGoal | null>(null);
  
  // Modal toggles
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [isCelebrationVisible, setIsCelebrationVisible] = useState(false);
  const [isMissedVisible, setIsMissedVisible] = useState(false);
  
  // Goal selection states
  const [isSelectingGoal, setIsSelectingGoal] = useState(false);
  const [localSelectedGoal, setLocalSelectedGoal] = useState<MicroGoal | null>(null);
  
  // Goal completed/mutation loading states
  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const [completedPoints, setCompletedPoints] = useState(0);
  const [dismissedMissedGoalIds, setDismissedMissedGoalIds] = useState<string[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"today" | "7days" | "30days">("7days");

  // Custom states
  const [selectedTime, setSelectedTime] = useState("12:00 PM");
  const [celebrationMsg, setCelebrationMsg] = useState("");
  const [missedMsg, setMissedMsg] = useState("");
  const [communityPhrase, setCommunityPhrase] = useState("");
  const [missedGoalItem, setMissedGoalItem] = useState<any>(null);

  // Load random quotes
  useEffect(() => {
    setCelebrationMsg(COMPLETED_CONGRATS[Math.floor(Math.random() * COMPLETED_CONGRATS.length)]);
    setMissedMsg(MISSED_ENCOURAGEMENTS[Math.floor(Math.random() * MISSED_ENCOURAGEMENTS.length)]);
    setCommunityPhrase(COMMUNITY_PHRASES[Math.floor(Math.random() * COMMUNITY_PHRASES.length)]);
  }, [isCelebrationVisible, isMissedVisible]);

  // Check for missed goals on mount or dailyGoals change
  useEffect(() => {
    if (dailyGoals && dailyGoals.length > 0) {
      const now = Date.now();
      const missed = dailyGoals.find(
        (g) => !g.completed && !g.skipped && g.scheduledTime && g.scheduledTime < now && !dismissedMissedGoalIds.includes(g._id)
      );
      if (missed) {
        setMissedGoalItem(missed);
        setIsMissedVisible(true);
      }
    }
  }, [dailyGoals, dismissedMissedGoalIds]);

  if (dailyGoals === undefined || totalPoints === undefined || streakInfo === undefined || latestScreening === undefined || goalHistory === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Personalization logic
  const wsas_total = latestScreening?.wsas_total ?? 0;
  const reqol10_total = latestScreening?.reqol10_total ?? 0;
  const triage_level = latestTriage?.level ?? 'mild';
  const isSevere = wsas_total > 20 || triage_level === 'severe';

  // Generate stable recommended goals for today
  const availableOptions = generateMicroGoals({ 
    wsas_total, 
    reqol10_total, 
    triage_level,
    userId: user?.id ?? "",
    dateStr: todayStr
  });

  // Filter options that haven't been added to today's list yet
  const remainingOptions = availableOptions.filter(opt => !dailyGoals.some(g => g.goalId === opt.id));

  const completedCount = dailyGoals.filter((g) => g.completed).length;
  const progressPercent = dailyGoals.length > 0 ? completedCount / dailyGoals.length : 0;

  const MAX_DAILY_GOALS = 3;

  const handleAddGoal = async (g: MicroGoal) => {
    if (dailyGoals.length >= MAX_DAILY_GOALS) {
      Alert.alert("Goal Limit Reached", "You can focus on a maximum of 3 microgoals per day.");
      setIsSelectingGoal(false);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsMutationLoading(true);
    try {
      const dbId = await createGoal({
        userId: user?.id ?? "",
        goalId: g.id,
        goalTitle: g.title,
        goalDescription: g.description,
        category: g.category,
        difficulty: g.difficulty,
        points: g.points,
      });
      
      setSelectedGoal({
        ...g,
        id: dbId
      });
      setIsSelectingGoal(false);
      setLocalSelectedGoal(null);
      setIsScheduleVisible(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not add goal. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleCreateRecommendedGoals = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsMutationLoading(true);
    try {
      for (const g of availableOptions) {
        if (dailyGoals.length >= MAX_DAILY_GOALS) break;
        await createGoal({
          userId: user?.id ?? "",
          goalId: g.id,
          goalTitle: g.title,
          goalDescription: g.description,
          category: g.category,
          difficulty: g.difficulty,
          points: g.points,
        });
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not generate goals. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleOpenGoalDetails = (goal: any) => {
    const matching = availableOptions.find(o => o.id === goal.goalId) || {
      id: goal.goalId,
      title: goal.goalTitle,
      description: goal.goalDescription,
      points: goal.points,
      category: goal.category,
      difficulty: goal.difficulty as any,
      whyItHelps: "This action builds consistency and mindfulness.",
      estimatedTime: "5 mins"
    };
    setSelectedGoal({
      ...matching,
      id: goal._id
    });
    setIsDetailsVisible(true);
  };

  const handleOpenSchedule = () => {
    setIsDetailsVisible(false);
    setIsScheduleVisible(true);
  };

  const handleOpenScheduleForGoal = (goal: any) => {
    const matching = availableOptions.find(o => o.id === goal.goalId) || {
      id: goal.goalId,
      title: goal.goalTitle,
      description: goal.goalDescription,
      points: goal.points,
      category: goal.category,
      difficulty: goal.difficulty as any,
      whyItHelps: "This action builds consistency and mindfulness.",
      estimatedTime: "5 mins"
    };
    setSelectedGoal({
      ...matching,
      id: goal._id
    });
    setIsDetailsVisible(false);
    setIsScheduleVisible(true);
  };

  const handleScheduleTimeSelect = async (timeStr: string) => {
    if (!selectedGoal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedTime(timeStr);
    
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    const scheduledTimeMs = scheduledDate.getTime();

    setIsMutationLoading(true);
    try {
      await scheduleGoal({
        id: selectedGoal.id as any,
        scheduledTime: scheduledTimeMs,
      });

      setIsScheduleVisible(false);
      setSelectedGoal(null);
      Alert.alert(
        "Goal Scheduled! ⏰",
        `Goal scheduled for ${timeStr}.`
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert("Scheduling Failed", e?.message || "Failed to schedule goal. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleCompleteGoal = async (id: any, points: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCompletedPoints(points);
    setIsMutationLoading(true);
    try {
      await completeGoal({ id });
      setCelebrationMsg(COMPLETED_CONGRATS[Math.floor(Math.random() * COMPLETED_CONGRATS.length)]);
      setIsCelebrationVisible(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not complete goal. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleSkipGoal = async (id: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsMutationLoading(true);
    try {
      await skipGoal({ id });
      setDismissedMissedGoalIds(prev => [...prev, id]);
      setIsMissedVisible(false);
      setMissedGoalItem(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not skip goal. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleRescheduleGoal = async (id: any, minutesOffset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsMutationLoading(true);
    try {
      const newTime = Date.now() + minutesOffset * 60 * 1000;
      await rescheduleGoal({ id, scheduledTime: newTime });

      setDismissedMissedGoalIds(prev => [...prev, id]);
      setIsMissedVisible(false);
      setMissedGoalItem(null);
      Alert.alert("Rescheduled ⏰", `Goal rescheduled for ${minutesOffset} minutes from now.`);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message || "Could not reschedule goal. Please try again.");
    } finally {
      setIsMutationLoading(false);
    }
  };

  const handleRescheduleCustom = (id: any) => {
    setIsMissedVisible(false);
    const dbGoal = dailyGoals.find(g => g._id === id);
    if (dbGoal) {
      handleOpenScheduleForGoal(dbGoal);
    }
  };

  const handleCloseMissed = () => {
    if (missedGoalItem) {
      setDismissedMissedGoalIds(prev => [...prev, missedGoalItem._id]);
    }
    setIsMissedVisible(false);
    setMissedGoalItem(null);
  };

  // Computations for goal history
  const historyNow = new Date();
  const startOfToday = new Date(historyNow.getFullYear(), historyNow.getMonth(), historyNow.getDate()).getTime();

  const filteredHistory = (goalHistory ?? []).filter((g) => {
    if (historyFilter === "today") {
      return g.createdAt >= startOfToday;
    } else if (historyFilter === "7days") {
      return g.createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    } else {
      return g.createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
  });

  const historyCompleted = filteredHistory.filter((g) => g.completed);
  const historySkipped = filteredHistory.filter((g) => g.skipped);
  const historyPoints = historyCompleted.reduce((sum, g) => sum + g.points, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F4F3FF', '#E0DBFF']} style={StyleSheet.absoluteFill} />

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(30, insets.top),
            paddingBottom: Math.max(20, insets.bottom + 20),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Today's MicroGoals</Text>
          <Text style={styles.subtitle}>Small steps create meaningful change.</Text>
        </View>

        {/* Home Stats Dashboard Card */}
        <View style={styles.glassCard}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statVal}>{totalPoints}</Text>
              <Text style={styles.statLbl}>Calm Points</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statVal}>{streakInfo?.currentStreak ?? 0} Days</Text>
              <Text style={styles.statLbl}>Streak</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statVal}>{completedCount} of {dailyGoals.length}</Text>
              <Text style={styles.statLbl}>Completed</Text>
            </View>
          </View>

          {dailyGoals.length > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Daily Progress</Text>
                <Text style={styles.progressPct}>{Math.round(progressPercent * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${progressPercent * 100}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Personalized Triage Banners */}
        {isSevere && (
          <View style={[styles.bannerCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <Ionicons name="heart-circle" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: '#B91C1C' }]}>
              Daily tasks seem difficult right now. We'll start with very small goals.
            </Text>
          </View>
        )}
        {reqol10_total < 15 && !isSevere && (
          <View style={[styles.bannerCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <Ionicons name="sparkles" size={20} color="#22C55E" style={{ marginRight: 8 }} />
            <Text style={[styles.bannerText, { color: '#15803D' }]}>
              Let's add a few wellbeing boosters to your day.
            </Text>
          </View>
        )}

        {/* Tabs to toggle views */}
        <View style={styles.viewTabs}>
          <TouchableOpacity 
            style={[styles.viewTabBtn, activeView === "dashboard" && styles.viewTabBtnActive]}
            onPress={() => setActiveView("dashboard")}
          >
            <Text style={[styles.viewTabText, activeView === "dashboard" && styles.viewTabTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewTabBtn, activeView === "history" && styles.viewTabBtnActive]}
            onPress={() => setActiveView("history")}
          >
            <Text style={[styles.viewTabText, activeView === "history" && styles.viewTabTextActive]}>Weekly & Badges</Text>
          </TouchableOpacity>
        </View>

        {activeView === "dashboard" && (
          <View style={styles.section}>
            {isSelectingGoal || dailyGoals.length === 0 ? (
              <View style={styles.selectionContainer}>
                <View style={styles.selectionHeader}>
                  <Text style={styles.selectionTitle}>Choose Today's Goal</Text>
                  <Text style={styles.selectionSubtitle}>Pick one small action to focus on.</Text>
                </View>

                {remainingOptions.length === 0 ? (
                  <View style={styles.generateCard}>
                    <Text style={styles.sectionTitle}>All Goals Added!</Text>
                    <Text style={styles.generateDesc}>
                      You have added all available recommended goals for today.
                    </Text>
                    {dailyGoals.length > 0 && (
                      <Button
                        title="Back to Dashboard"
                        onPress={() => setIsSelectingGoal(false)}
                        style={styles.actionBtn}
                      />
                    )}
                  </View>
                ) : (
                  <View style={styles.optionsList}>
                    {remainingOptions.map((opt) => {
                      const isSelected = localSelectedGoal?.id === opt.id;
                      const categoryIcons: Record<string, string> = {
                        health: "medical-outline",
                        movement: "walk-outline",
                        mindfulness: "leaf-outline",
                        routine: "calendar-outline",
                        joy: "happy-outline",
                        social: "chatbubbles-outline",
                        wellbeing: "sparkles-outline"
                      };
                      const iconName = categoryIcons[opt.category] || "checkbox-outline";

                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardSelected
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setLocalSelectedGoal(opt);
                          }}
                        >
                          <View style={styles.optionCardHeader}>
                            <View style={[styles.categoryIconBox, { backgroundColor: isSelected ? '#FAF9FF' : '#F3F0FF' }]}>
                              <Ionicons name={iconName as any} size={22} color={Colors.primary} />
                            </View>
                            <View style={styles.pointsBadge}>
                              <Text style={styles.pointsBadgeText}>+{opt.points} pts</Text>
                            </View>
                          </View>
                          
                          <Text style={styles.optionCardTitle}>🎯 {opt.title}</Text>
                          <Text style={styles.optionCardDesc}>{opt.description}</Text>

                          <View style={styles.dividerHorizontal} />

                          <View style={styles.optionFooter}>
                            <Text style={styles.optionFooterText}>⏰ Estimated Time: {opt.estimatedTime}</Text>
                            <Text style={styles.optionFooterText}>💡 Why It Helps: {opt.whyItHelps}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    <View style={styles.selectionActions}>
                      <Button
                        title="Add Goal to My Day"
                        disabled={!localSelectedGoal}
                        onPress={() => localSelectedGoal && handleAddGoal(localSelectedGoal)}
                        style={styles.actionBtn}
                      />
                      
                      {dailyGoals.length > 0 && (
                        <Button
                          title="Cancel"
                          variant="outline"
                          onPress={() => {
                            setIsSelectingGoal(false);
                            setLocalSelectedGoal(null);
                          }}
                          style={styles.actionBtnOutline}
                          textStyle={{ color: Colors.primary }}
                        />
                      )}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.goalsList}>
                <Text style={styles.sectionTitle}>Active Goals For Today</Text>
                
                {dailyGoals.map((goal) => (
                  <View key={goal._id} style={[styles.goalItemCard, goal.completed && styles.goalItemCompleted]}>
                    <TouchableOpacity 
                      disabled={goal.completed || goal.skipped}
                      onPress={() => handleCompleteGoal(goal._id, goal.points)}
                      style={[styles.checkCircle, goal.completed && styles.checkCircleActive]}
                    >
                      {goal.completed && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1 }} 
                      onPress={() => handleOpenGoalDetails(goal)}
                      disabled={goal.completed || goal.skipped}
                    >
                      <Text style={[styles.goalItemTitle, goal.completed && styles.goalTitleCompleted]}>
                        🎯 {goal.goalTitle}
                      </Text>
                      <Text style={styles.goalItemDesc}>{goal.goalDescription}</Text>
                      {goal.scheduledTime ? (
                        <Text style={styles.scheduledLabel}>
                          ⏰ Scheduled for {new Date(goal.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                      ) : null}
                    </TouchableOpacity>

                    <View style={styles.rewardContainer}>
                      <Text style={styles.rewardText}>+{goal.points} pts</Text>
                      {!goal.completed && !goal.skipped && (
                        <TouchableOpacity style={styles.scheduleBtn} onPress={() => handleOpenGoalDetails(goal)}>
                          <Ionicons name="alarm-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}

                {/* Create/Add goal button at the bottom of the active list */}
                {remainingOptions.length > 0 && (
                  <TouchableOpacity
                    style={styles.addGoalCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setIsSelectingGoal(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={24} color={Colors.primary} />
                    <Text style={styles.addGoalCardText}>Choose Another Goal ({remainingOptions.length} left)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Community Modeling */}
            <View style={styles.communityCard}>
              <View style={styles.communityIconBox}>
                <Ionicons name="people" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.communityTitle}>Campus Pulse</Text>
                <Text style={styles.communityText}>{communityPhrase}</Text>
              </View>
            </View>
          </View>
        )}

        {activeView === "history" && (
          <View style={styles.section}>
            {/* Timeframe Selector tabs */}
            <View style={styles.historyTabs}>
              {[
                { id: "today", label: "Today" },
                { id: "7days", label: "7 Days" },
                { id: "30days", label: "30 Days" }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.historyTabBtn,
                    historyFilter === tab.id && styles.historyTabBtnActive
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setHistoryFilter(tab.id as any);
                  }}
                >
                  <Text
                    style={[
                      styles.historyTabText,
                      historyFilter === tab.id && styles.historyTabTextActive
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Metrics cards grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>✅ {historyCompleted.length}</Text>
                <Text style={styles.metricLbl}>Completed</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>⏭️ {historySkipped.length}</Text>
                <Text style={styles.metricLbl}>Skipped</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>⭐ {historyPoints}</Text>
                <Text style={styles.metricLbl}>Points</Text>
              </View>
            </View>

            {/* Streak History Card */}
            <View style={styles.glassCard}>
              <Text style={styles.sectionTitle}>Streak Status</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>🔥</Text>
                  <Text style={{ fontFamily: Theme.fontFamily.bold, fontSize: 15, color: Colors.text, marginTop: 4 }}>
                    {streakInfo?.currentStreak ?? 0} Days
                  </Text>
                  <Text style={{ fontFamily: Theme.fontFamily.medium, fontSize: 10, color: Colors.textSecondary }}>
                    Current Streak
                  </Text>
                </View>
                <View style={{ width: 1.5, height: '80%', backgroundColor: '#EBE9FE', alignSelf: 'center' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24 }}>🏆</Text>
                  <Text style={{ fontFamily: Theme.fontFamily.bold, fontSize: 15, color: Colors.text, marginTop: 4 }}>
                    {streakInfo?.longestStreak ?? 0} Days
                  </Text>
                  <Text style={{ fontFamily: Theme.fontFamily.medium, fontSize: 10, color: Colors.textSecondary }}>
                    Longest Streak
                  </Text>
                </View>
              </View>
            </View>

            {/* Activity Feed */}
            <View style={[styles.glassCard, { paddingBottom: 16 }]}>
              <Text style={styles.sectionTitle}>Activity Feed</Text>
              {filteredHistory.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Ionicons name="journal-outline" size={36} color={Colors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontFamily: Theme.fontFamily.medium, fontSize: 12, color: Colors.textSecondary, textAlign: 'center' }}>
                    No goals logged for this timeframe.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 12 }}>
                  {filteredHistory.map((g) => {
                    const statusColor = g.completed ? "#10B981" : "#94A3B8";
                    const statusText = g.completed ? "Completed" : "Skipped";
                    
                    return (
                      <View key={g._id} style={styles.historyGoalCard}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.historyGoalTitle}>
                            {g.goalTitle}
                          </Text>
                          <Text style={styles.historyGoalDate}>
                            {new Date(g.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                          </View>
                          {g.completed && (
                            <Text style={{ fontFamily: Theme.fontFamily.bold, fontSize: 11, color: Colors.primary }}>
                              +{g.points} pts
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Badges unlocked */}
            <View style={[styles.glassCard, { marginTop: Theme.spacing.sm }]}>
              <Text style={styles.sectionTitle}>Your Badges</Text>
              <View style={styles.badgesGrid}>
                {BADGES_DEFINITIONS.map((badge) => {
                  const isEarned = badgesEarned?.some(b => b.badgeId === badge.id);
                  return (
                    <View key={badge.id} style={[styles.badgeCard, !isEarned && styles.badgeCardLocked]}>
                      <View style={[styles.badgeIconBox, { backgroundColor: isEarned ? badge.color + "15" : "#E2E8F0" }]}>
                        <Ionicons name={badge.icon as any} size={28} color={isEarned ? badge.color : Colors.textMuted} />
                      </View>
                      <Text style={[styles.badgeName, !isEarned && { color: Colors.textMuted }]}>{badge.name}</Text>
                      <Text style={styles.badgeDesc}>{badge.desc}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* GOAL DETAILS MODAL */}
      <Modal visible={isDetailsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goal Details</Text>
              <TouchableOpacity onPress={() => setIsDetailsVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View style={styles.modalScroll}>
                <Text style={styles.detailsGoalTitle}>🎯 {selectedGoal.title}</Text>
                <Text style={styles.detailsGoalDesc}>{selectedGoal.description}</Text>

                <View style={styles.dividerHorizontal} />

                <View style={styles.detailRow}>
                  <Ionicons name="help-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Why It Helps</Text>
                    <Text style={styles.detailText}>{selectedGoal.whyItHelps}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Estimated Time</Text>
                    <Text style={styles.detailText}>{selectedGoal.estimatedTime}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="star-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Reward Points</Text>
                    <Text style={styles.detailText}>+{selectedGoal.points} Calm Points</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button 
                    title="Start Goal" 
                    onPress={handleOpenSchedule} 
                    style={styles.actionBtn}
                  />
                  <Button 
                    title="Choose Another Goal" 
                    variant="outline"
                    onPress={() => setIsDetailsVisible(false)} 
                    style={styles.actionBtnOutline}
                    textStyle={{ color: Colors.primary }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* SCHEDULING MODAL */}
      <Modal visible={isScheduleVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Reminder</Text>
              <TouchableOpacity onPress={() => setIsScheduleVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.schedulePrompt}>Great. When would you like to try this today?</Text>

            <View style={styles.scheduleOptions}>
              {["9:00 AM", "12:00 PM", "5:00 PM"].map((time) => (
                <TouchableOpacity 
                  key={time} 
                  style={styles.timeOptionCard}
                  onPress={() => handleScheduleTimeSelect(time)}
                >
                  <Ionicons name="time" size={20} color={Colors.primary} />
                  <Text style={styles.timeOptionText}>{time}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={[styles.timeOptionCard, { borderColor: Colors.primary + "50" }]}
                onPress={() => handleScheduleTimeSelect("8:00 PM")}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.timeOptionText}>Custom (8:00 PM)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MISSED GOAL SUPPORTIVE RECOVERY MODAL */}
      <Modal visible={isMissedVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#EA580C' }]}>Gentle Pause</Text>
              <TouchableOpacity onPress={handleCloseMissed}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {missedGoalItem && (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Ionicons name="cafe-outline" size={44} color="#EA580C" style={{ marginBottom: Theme.spacing.md }} />
                <Text style={styles.missedPrompt}>"{missedMsg}"</Text>
                
                <Text style={styles.missedGoalTitle}>Goal: {missedGoalItem.goalTitle}</Text>

                <View style={styles.modalActions}>
                  <Button 
                    title="Try Again" 
                    onPress={() => handleRescheduleGoal(missedGoalItem._id, 2)} 
                    style={styles.actionBtn}
                  />
                  <Button 
                    title="Do Breathing Exercise" 
                    onPress={() => {
                      setIsMissedVisible(false);
                      setDismissedMissedGoalIds(prev => [...prev, missedGoalItem._id]);
                      setMissedGoalItem(null);
                      router.push("/(auth)/tools/jpmr"); // Redirect to relaxation
                    }} 
                    style={styles.actionBtn}
                  />
                  <Button 
                    title="Reschedule Time" 
                    variant="outline"
                    onPress={() => handleRescheduleCustom(missedGoalItem._id)} 
                    style={styles.actionBtnOutline}
                    textStyle={{ color: Colors.primary }}
                  />
                  <Button 
                    title="Skip Today" 
                    variant="outline"
                    onPress={() => handleSkipGoal(missedGoalItem._id)} 
                    style={styles.actionBtnOutline}
                    textStyle={{ color: '#EF4444' }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* CELEBRATION MODAL */}
      <Modal visible={isCelebrationVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.celebrationWrapper}>
              <Ionicons name="sparkles" size={54} color="#F59E0B" style={{ marginBottom: Theme.spacing.md }} />
              <Text style={styles.celebrationTitle}>Goal Completed!</Text>
              <Text style={styles.celebrationPoints}>+{completedPoints} Calm Points</Text>

              <Text style={styles.celebrationSubtitle}>"{celebrationMsg}"</Text>

              <View style={styles.summaryResultCard}>
                <Text style={styles.resultPercentage}>{streakInfo?.currentStreak ?? 1} Days</Text>
                <Text style={styles.resultLabel}>Current Streak</Text>
                <Text style={styles.resultVal}>Total: {totalPoints} Points</Text>
              </View>

              <Button 
                title="Awesome" 
                onPress={() => setIsCelebrationVisible(false)} 
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {isMutationLoading && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </View>
      )}

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
    marginBottom: Theme.spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
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
    marginBottom: Theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Theme.spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statVal: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  statLbl: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dividerVertical: {
    width: 1.5,
    height: '80%',
    backgroundColor: '#EBE9FE',
    alignSelf: 'center',
  },
  progressContainer: {
    marginTop: Theme.spacing.md,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#EBE9FE',
    paddingTop: Theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressPct: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FAF9FF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    marginBottom: Theme.spacing.md,
  },
  bannerText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    flex: 1,
  },
  viewTabs: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    padding: 4,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  viewTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  viewTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  viewTabText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  viewTabTextActive: {
    color: Colors.white,
  },
  section: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  generateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: Theme.spacing.lg,
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: Theme.spacing.xs,
    width: '100%',
  },
  generateDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
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
    marginTop: 10,
  },
  goalsList: {
    width: '100%',
    gap: 12,
  },
  goalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Theme.spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE9FE',
    ...Theme.shadows.tertiary,
  },
  goalItemCompleted: {
    opacity: 0.65,
    backgroundColor: '#F8FAFC',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  checkCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalItemTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm + 1,
    color: Colors.text,
    marginBottom: 2,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  goalItemDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  scheduledLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.primary,
    marginTop: 4,
  },
  rewardContainer: {
    alignItems: 'center',
    marginLeft: Theme.spacing.sm,
    gap: 6,
  },
  rewardText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: Colors.primary,
  },
  scheduleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F0FF',
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: 12,
  },
  communityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary + "10",
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 2,
  },
  communityText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  weeklySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Theme.spacing.md,
  },
  weeklySummaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  weeklySummaryVal: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 24,
    color: Colors.primary,
  },
  weeklySummaryLbl: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  insightsList: {
    borderTopWidth: 1,
    borderTopColor: '#EBE9FE',
    paddingTop: Theme.spacing.md,
    width: '100%',
    gap: 8,
  },
  insightTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    marginBottom: 4,
  },
  insightText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
  },
  badgeCard: {
    width: (width - 70) / 2,
    backgroundColor: '#FAF9FF',
    borderRadius: 20,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5FF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Theme.spacing.xl,
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE9FE',
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
  },
  modalScroll: {
    width: '100%',
  },
  detailsGoalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
    marginBottom: 6,
  },
  detailsGoalDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: '#EBE9FE',
    width: '100%',
    marginVertical: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    width: '100%',
  },
  detailLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  modalActions: {
    gap: 8,
    width: '100%',
    marginTop: Theme.spacing.sm,
  },
  schedulePrompt: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  scheduleOptions: {
    width: '100%',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  timeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
    borderWidth: 1.5,
    borderColor: '#EBE9FE',
    borderRadius: 16,
    padding: Theme.spacing.md,
    gap: 12,
  },
  timeOptionText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  celebrationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  celebrationTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  celebrationPoints: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 18,
    color: Colors.primary,
    marginBottom: Theme.spacing.md,
  },
  celebrationSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Theme.spacing.md,
  },
  summaryResultCard: {
    backgroundColor: 'rgba(244, 243, 255, 0.5)',
    borderRadius: 20,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(235, 233, 254, 0.8)',
    marginBottom: Theme.spacing.xl,
  },
  resultPercentage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 36,
    color: Colors.primary,
  },
  resultLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultVal: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 13,
    color: Colors.text,
  },
  missedPrompt: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm + 1,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.sm,
  },
  missedGoalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm + 1,
    color: Colors.text,
    marginBottom: Theme.spacing.lg,
  },
  selectionContainer: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  selectionHeader: {
    width: '100%',
    marginBottom: Theme.spacing.sm,
  },
  selectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md + 2,
    color: Colors.text,
  },
  selectionSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optionsList: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#FAF9FF',
  },
  optionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsBadge: {
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: Colors.primary,
  },
  optionCardTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    marginBottom: 6,
  },
  optionCardDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Theme.spacing.md,
  },
  optionFooter: {
    gap: 6,
    width: '100%',
  },
  optionFooterText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  selectionActions: {
    gap: 10,
    width: '100%',
    marginTop: Theme.spacing.md,
  },
  addGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    padding: Theme.spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: Theme.spacing.xs,
    width: '100%',
  },
  addGoalCardText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
  },
  historyTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F0FB',
    borderRadius: 16,
    padding: 4,
    marginBottom: Theme.spacing.md,
  },
  historyTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  historyTabBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyTabText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  historyTabTextActive: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Theme.spacing.md,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  metricVal: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: Colors.text,
  },
  metricLbl: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  historyGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: Theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE9FE',
  },
  historyGoalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
    marginBottom: 4,
  },
  historyGoalDate: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
  },
});
