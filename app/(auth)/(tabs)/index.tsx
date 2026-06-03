import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions, Animated } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { getDisplayLevel } from "@/utils/triage";
import { generateInsightMessage } from "@/utils/insights";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get('window');

const TOTAL_QUESTIONS = 47; // PHQ9:9 + GAD7:7 + PQ16:16 + WSAS:5 + ReQoL10:10
const SCREENING_STORE_KEY = "screening_progress";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [overallProgress, setOverallProgress] = React.useState(0);

  // Reload screening progress every time this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      async function loadProgress() {
        try {
          const saved = await SecureStore.getItemAsync(SCREENING_STORE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as Record<string, (number | null)[]>;
            const totalAnswered = Object.values(parsed).reduce(
              (sum, arr) => sum + arr.filter((a) => a !== null).length,
              0
            );
            setOverallProgress(Math.round((totalAnswered / TOTAL_QUESTIONS) * 100));
          } else {
            setOverallProgress(0);
          }
        } catch (e) {
          setOverallProgress(0);
        }
      }
      loadProgress();
    }, [])
  );

  const appUser = useQuery(api.users.getByClerkId, {
    clerkId: user?.id ?? "",
  });

  const latestScreening = useQuery(api.screening.getLatest, {
    userId: user?.id ?? "",
  });

  const latestTriage = useQuery(api.triage.getLatest, {
    userId: user?.id ?? "",
  });

  const recentEmotions = useQuery(api.emotionLogs.getRecent, {
    userId: user?.id ?? "",
  });

  const recentJpmr = useQuery(api.jpmrLogs.getRecent, {
    userId: user?.id ?? "",
  });

  const reinforcement = useQuery(api.reinforcement.generatePositiveMessage, {
    userId: user?.id ?? "",
  });

  const updateWellness = useMutation(api.wellness.updateProfile);

  React.useEffect(() => {
    if (user?.id) {
      updateWellness({ userId: user.id });
    }
  }, [user?.id]);

  if (appUser === undefined || latestScreening === undefined || latestTriage === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const alias = appUser?.alias || "there";
  const isScreeningComplete = !!appUser?.screeningComplete;

  const displayLevel = isScreeningComplete
    ? (latestTriage ? getDisplayLevel(latestTriage.level as any) : "Assessment Pending")
    : "Initial Screening Required";
  
  const wsasScore = latestScreening?.wsas_total ?? 0;
  const reqolScore = latestScreening?.reqol10_total ?? 0;

  const { recommendation } = isScreeningComplete
    ? generateInsightMessage({
        triage_level: latestTriage?.level as any || 'mild',
        wsas_total: wsasScore,
        reqol10_total: reqolScore,
        alias,
        recentEmotions: recentEmotions ?? [],
        recentTools: recentJpmr ?? [],
      })
    : {
        recommendation: "Welcome to Emotify! Please complete your initial screening test to assess your wellbeing and unlock personalized therapeutic tools."
      };

  const isSevere = latestTriage && ["severe", "suicide_flag", "psychosis_flag"].includes(latestTriage.level);

  const tools = [];
  if (!isScreeningComplete) {
    tools.push({
      id: 'screening',
      title: 'Take Screening Test',
      sub: 'Required Initial Assessment',
      icon: '📋',
      route: '/(auth)/screening',
      highlighted: true
    });
  }
  tools.push(
    { id: 'emotion-map', title: 'Quick Check', sub: 'Body Scan', icon: '🗺️', route: '/(auth)/tools/emotion-map', locked: !isScreeningComplete },
    { id: 'jpmr', title: 'Relax Now', sub: 'Relaxation', icon: '🧘', route: '/(auth)/tools/jpmr', locked: !isScreeningComplete },
    { id: 'reframe', title: 'Reframe Now', sub: 'Thoughts', icon: '🧠', route: '/(auth)/tools/reframe', restricted: isSevere, locked: !isScreeningComplete },
    { id: 'microgoals', title: 'MicroGoals', sub: 'Habits', icon: '🎯', route: '/(auth)/tools/microgoals', locked: !isScreeningComplete }
  );

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle Floating Glows */}
      <View style={[styles.glowBall, { top: -50, right: -50, backgroundColor: Colors.primary + '15' }]} />
      <View style={[styles.glowBall, { bottom: 100, left: -50, backgroundColor: Colors.secondary + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning, {alias} 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Screening Progress Tag */}
        {!isScreeningComplete && (
          <TouchableOpacity
            style={styles.progressTag}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/screening' as any)}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressTagGradient}
            >
              <View style={styles.progressTagLeft}>
                <Ionicons name="clipboard-outline" size={20} color="rgba(255,255,255,0.9)" />
                <View style={styles.progressTagText}>
                  <Text style={styles.progressTagTitle}>
                    Screening {overallProgress}% Complete
                  </Text>
                  <Text style={styles.progressTagSub}>
                    Complete screening to unlock clinical dashboard
                  </Text>
                </View>
              </View>
              <View style={styles.progressTagRight}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressCircleText}>{overallProgress}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Positive Reinforcement Section */}
        {reinforcement && isScreeningComplete && (
          <View style={styles.growthSection}>
            <View style={styles.growthCard}>
              <View style={styles.growthIconBox}>
                <Ionicons name="sparkles" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.growthContent}>
                <Text style={styles.growthTitle}>YOUR GROWTH 🌱</Text>
                <Text style={styles.growthMessage}>{reinforcement.message}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Hero Card */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={isScreeningComplete ? [Colors.primary, Colors.secondary] : ['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>YOUR CURRENT STATE</Text>
              <View style={styles.moodBadge}>
                <Text style={styles.moodText}>{displayLevel}</Text>
              </View>
              <Text style={styles.heroMessage}>{recommendation}</Text>
            </View>
          </LinearGradient>
          <View style={styles.heroGlow} />
        </View>

        {/* Stats Section */}
        {isScreeningComplete && (
          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="fitness-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.scoreValue}>{wsasScore}</Text>
              <Text style={styles.scoreLabel}>FUNCTIONING</Text>
            </View>
            
            <View style={styles.scoreCard}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.secondary + '15' }]}>
                <Ionicons name="heart-outline" size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.scoreValue}>{reqolScore}</Text>
              <Text style={styles.scoreLabel}>WELL-BEING</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Therapeutic Tools</Text>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {tools.map((tool, index) => {
            const isFullWidth = tool.highlighted;
            return (
              <View key={tool.id} style={isFullWidth && { width: '100%', marginBottom: 8 }}>
                <TouchableOpacity 
                  style={[
                    styles.toolCard, 
                    isFullWidth && { width: width - Theme.spacing.lg * 2, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderWidth: 1.5, borderColor: '#818CF8' },
                    tool.locked && { opacity: 0.6 }
                  ]} 
                  activeOpacity={0.9} 
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => {
                    if (tool.locked) {
                      Alert.alert("Locked Module", "Please complete your initial Screening Test first to unlock therapeutic tools.");
                    } else if (tool.restricted) {
                      Alert.alert("Counselor Recommended", "This tool is best used with professional guidance during high distress.");
                    } else {
                      router.push(tool.route as any);
                    }
                  }}
                >
                  <Animated.View style={[{ transform: [{ scale: scaleAnim }], alignItems: 'center', width: '100%' }, isFullWidth && { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }]}>
                    <View style={[isFullWidth ? { flexDirection: 'row', alignItems: 'center', gap: 16 } : { alignItems: 'center' }]}>
                      <View style={[styles.toolIconContainer, isFullWidth && { marginBottom: 0, width: 52, height: 52 }]}>
                        <Text style={[styles.toolEmoji, isFullWidth && { fontSize: 26 }]}>{tool.icon}</Text>
                        {tool.locked && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={12} color="#475569" />
                          </View>
                        )}
                      </View>
                      <View style={[isFullWidth ? { alignItems: 'flex-start' } : { alignItems: 'center' }]}>
                        <Text style={[styles.toolTitle, isFullWidth && { textAlign: 'left', fontSize: 18, color: '#1E1B4B' }]}>{tool.title}</Text>
                        <Text style={[styles.toolSub, isFullWidth && { textAlign: 'left', color: '#4F46E5' }]}>{tool.sub}</Text>
                      </View>
                    </View>
                    {isFullWidth && (
                      <Ionicons name="chevron-forward" size={22} color="#4F46E5" />
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowBall: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: Theme.spacing.xxl,
  },
  greeting: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xl,
    color: Colors.text,
    marginBottom: 4,
  },
  date: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
  },
  growthSection: {
    marginBottom: Theme.spacing.xl,
  },
  growthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Theme.shadows.tertiary,
    gap: 12,
  },
  growthIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthContent: {
    flex: 1,
  },
  growthTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  growthMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  heroContainer: {
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  },
  heroCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    minHeight: 180,
    ...Theme.shadows.primary,
  },
  heroContent: {
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: Theme.spacing.md,
  },
  moodBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    marginBottom: Theme.spacing.lg,
  },
  moodText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: Colors.white,
  },
  heroMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 22,
    color: Colors.white,
    lineHeight: 30,
  },
  heroGlow: {
    position: 'absolute',
    bottom: -15,
    left: '10%',
    width: '80%',
    height: 40,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    borderRadius: 40,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Theme.spacing.xl,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.secondary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 24,
    color: Colors.text,
  },
  scoreLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
    marginTop: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  toolCard: {
    width: (width - Theme.spacing.lg * 2 - 16) / 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Theme.shadows.tertiary,
  },
  toolIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  toolEmoji: {
    fontSize: 32,
  },
  toolTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    color: Colors.text,
    textAlign: 'center',
  },
  toolSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTag: {
    marginBottom: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.secondary,
  },
  progressTagGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 14,
  },
  progressTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressTagText: {
    flex: 1,
  },
  progressTagTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressTagSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 15,
  },
  progressTagRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  progressCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  progressCircleText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
});
