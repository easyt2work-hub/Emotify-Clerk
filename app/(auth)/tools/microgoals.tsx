import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { generateMicroGoals } from "@/utils/microgoals";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { REINFORCEMENT_MESSAGES } from "@/constants/Wellness";

export default function MicroGoalsScreen() {
  const { user: clerkUser } = useUser();
  const today = new Date().toISOString().split('T')[0];

  const latestScreening = useQuery(api.screening.getLatest, {
    userId: clerkUser?.id ?? "",
  });
  
  const latestTriage = useQuery(api.triage.getLatest, {
    userId: clerkUser?.id ?? "",
  });

  const dailyGoals = useQuery(api.microGoals.getByDate, {
    userId: clerkUser?.id ?? "",
    date: today,
  });

  const totalPoints = useQuery(api.microGoals.getTotalPoints, {
    userId: clerkUser?.id ?? "",
  });
  
  const streak = useQuery(api.microGoals.getStreak, {
    userId: clerkUser?.id ?? "",
  });

  const createGoal = useMutation(api.microGoals.create);
  const completeGoal = useMutation(api.microGoals.markComplete);

  const [isAdding, setIsAdding] = useState(false);

  // Dynamic Smart MicroGoals Engine
  const wsas_total = latestScreening?.wsas_total ?? 0;
  const reqol10_total = latestScreening?.reqol10_total ?? 0;
  const triage_level = latestTriage?.level ?? 'mild';
  
  const availableGoals = generateMicroGoals({ wsas_total, reqol10_total, triage_level });

  async function handleAddGoal(goalId: string, label: string, points: number) {
    if (!clerkUser) return;
    try {
      await createGoal({
        userId: clerkUser.id,
        goalId,
        goal: label,
        points,
        date: today,
      });
      setIsAdding(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleComplete(id: any) {
    try {
      await completeGoal({ id });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const randomMessage = REINFORCEMENT_MESSAGES[Math.floor(Math.random() * REINFORCEMENT_MESSAGES.length)];
      Alert.alert("Goal Completed! 🎯", randomMessage);
    } catch (error) {
      console.error(error);
    }
  }

  if (dailyGoals === undefined || totalPoints === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const completedCount = dailyGoals.filter(g => g.completed).length;
  const progressPercent = dailyGoals.length > 0 ? (completedCount / dailyGoals.length) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Goals</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statText}>⭐ {totalPoints}</Text>
          </View>
          {streak !== undefined && streak > 0 && (
            <View style={[styles.statBadge, { backgroundColor: '#FFF5F5' }]}>
              <Text style={[styles.statText, { color: '#FF4D4F' }]}>🔥 {streak}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {dailyGoals.length > 0 && (
        <View style={styles.progressWrapper}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={styles.progressValue}>{Math.round(progressPercent * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
          </View>
        </View>
      )}

      {isAdding ? (
        <View style={styles.selectorSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose a goal</Text>
            <TouchableOpacity onPress={() => setIsAdding(false)}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {availableGoals.map((g) => (
            <TouchableOpacity 
              key={g.id} 
              style={styles.availableGoalCard}
              onPress={() => handleAddGoal(g.id, g.title, g.points)}
            >
              <View style={styles.availableIcon}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.availableTitle}>{g.title}</Text>
                <Text style={styles.availableDesc}>{g.description}</Text>
              </View>
              <Text style={styles.availablePoints}>+{g.points}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.goalsSection}>
          {dailyGoals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="sparkles-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Start your day</Text>
              <Text style={styles.emptySub}>Set small goals to build your momentum today.</Text>
              <Button 
                title="Pick a Goal" 
                onPress={() => setIsAdding(true)} 
                style={styles.pickBtn}
              />
            </View>
          ) : (
            <View style={styles.goalsList}>
              {dailyGoals.map((goal) => (
                <TouchableOpacity 
                  key={goal._id} 
                  style={[styles.goalCard, goal.completed && styles.goalCardCompleted]}
                  onPress={() => !goal.completed && handleComplete(goal._id)}
                  disabled={goal.completed}
                >
                  <View style={[styles.checkCircle, goal.completed && styles.checkCircleActive]}>
                    {goal.completed && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, goal.completed && styles.goalTitleCompleted]}>
                      {goal.goal}
                    </Text>
                    <Text style={styles.goalMeta}>Earned {goal.points} points</Text>
                  </View>
                  {goal.completed && <Ionicons name="sparkles" size={20} color="#F59E0B" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => setIsAdding(true)}>
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
                <Text style={styles.addMoreText}>Add another goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Theme.spacing.lg, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xl,
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
  },
  statsContainer: { flexDirection: 'row', gap: 8 },
  statBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    ...Theme.shadows.soft,
  },
  statText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xs,
    color: Colors.text,
  },
  progressWrapper: {
    backgroundColor: Colors.white,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.text,
  },
  progressValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  goalsSection: { gap: Theme.spacing.md },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xxl,
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  emptyTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
    marginTop: Theme.spacing.md,
  },
  emptySub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: Theme.spacing.xl,
    lineHeight: 20,
  },
  pickBtn: { width: '100%', borderRadius: Theme.borderRadius.lg },
  goalsList: { gap: Theme.spacing.md },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.soft,
  },
  goalCardCompleted: { opacity: 0.6 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  checkCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalInfo: { flex: 1 },
  goalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  goalTitleCompleted: { textDecorationLine: 'line-through' },
  goalMeta: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    gap: 8,
  },
  addMoreText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.primary,
  },
  selectorSection: { gap: Theme.spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    color: Colors.text,
  },
  cancelLink: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.textSecondary,
  },
  availableGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.soft,
  },
  availableIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  availableTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
  },
  availableDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  availablePoints: {
    fontFamily: Theme.fontFamily.bold,
    color: Colors.primary,
    fontSize: Theme.fontSize.sm,
  },
});
