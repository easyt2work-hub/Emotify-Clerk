import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions, Animated, Modal } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAppAuth } from "@/utils/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Theme } from "@/constants/Theme";
import { EMOTIONS } from "@/constants/Screening";
import { useThemeColors, useStyles } from "@/context/MoodThemeContext";
import { Button } from "@/components/ui/Button";
import { getDisplayLevel } from "@/utils/triage";
import { generateInsightMessage } from "@/utils/insights";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get('window');

const TOTAL_QUESTIONS = 47; // PHQ9:9 + GAD7:7 + PQ16:16 + WSAS:5 + ReQoL10:10
const SCREENING_STORE_KEY = "screening_progress";

function getAppointmentTimeLeft(startTime: number, endTime: number, now: number): string | null {
  if (now > endTime) return null; // already passed
  
  if (now >= startTime && now <= endTime) {
    const diffMs = endTime - now;
    const mins = Math.floor(diffMs / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
    return `Ongoing (${mins} mins ${secs} sec left)`;
  }
  
  const diffMs = startTime - now;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffSecs < 60) {
    return `${diffSecs} sec left`;
  }
  
  if (diffMins < 60) {
    const secs = diffSecs % 60;
    return `${diffMins} mins ${secs} sec left`;
  }
  
  if (diffHrs < 24) {
    const mins = diffMins % 60;
    return `${diffHrs} hrs ${mins} mins left`;
  }
  
  const hrs = diffHrs % 24;
  return `${diffDays} days ${hrs} hrs left`;
}

function AppointmentCountdown({
  startTime,
  endTime,
  colors,
}: {
  startTime: number;
  endTime: number;
  colors: any;
}) {
  const [timeLeft, setTimeLeft] = React.useState<string | null>(() =>
    getAppointmentTimeLeft(startTime, endTime, Date.now())
  );
  const [isOngoing, setIsOngoing] = React.useState(() => {
    const now = Date.now();
    return now >= startTime && now <= endTime;
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const left = getAppointmentTimeLeft(startTime, endTime, now);
      setTimeLeft(left);
      setIsOngoing(now >= startTime && now <= endTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ fontSize: 11, color: '#EF4444', fontFamily: Theme.fontFamily.medium }}>
        Debug: now={Date.now()} start={startTime} end={endTime} left={String(timeLeft)}
      </Text>
      {timeLeft && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons 
            name="time-outline" 
            size={14} 
            color={isOngoing ? '#EF4444' : colors.primary} 
          />
          <Text style={{ 
            fontFamily: Theme.fontFamily.bold, 
            fontSize: 13, 
            color: isOngoing ? '#EF4444' : colors.primary 
          }}>
            {timeLeft}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAppAuth();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [overallProgress, setOverallProgress] = React.useState(0);
  const colors = useThemeColors();
  const styles = useStyles(stylesFactory as any) as any;

  const [showCheckInModal, setShowCheckInModal] = React.useState(false);
  const [selectedEmotionId, setSelectedEmotionId] = React.useState<string | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = React.useState(false);
  const createLog = useMutation(api.emotionLogs.create);

  // Reload screening progress every time this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      async function loadProgress() {
        if (!user?.id) return;
        try {
          const key = `${SCREENING_STORE_KEY}_${user.id}`;
          const saved = await SecureStore.getItemAsync(key);
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
    }, [user?.id])
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

  const appointments = useQuery(api.appointments.getPatientAppointments, user?.id ? { userId: user.id } : "skip");

  const updateWellness = useMutation(api.wellness.updateProfile);

  React.useEffect(() => {
    if (user?.id) {
      updateWellness({ userId: user.id });
    }
  }, [user?.id]);

  const isScreeningComplete = appUser ? !!appUser.screeningComplete : false;

  // Mount detection for daily check-in modal
  React.useEffect(() => {
    async function checkTodayCheckIn() {
      if (!user?.id || !isScreeningComplete) return;
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const key = `last_checkin_date_${user.id}`;
        const lastCheckin = await SecureStore.getItemAsync(key);
        if (lastCheckin !== todayStr) {
          setShowCheckInModal(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkTodayCheckIn();
  }, [user?.id, isScreeningComplete]);

  if (appUser === undefined || latestScreening === undefined || latestTriage === undefined || appointments === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const alias = appUser?.alias || "there";

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

  // Active emotion mapping for display
  const activeEmotion = recentEmotions && recentEmotions.length > 0 ? recentEmotions[0].emotion : null;
  const activeEmotionObj = EMOTIONS.find(e => e.id === activeEmotion);

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

  const handleCheckInSubmit = async () => {
    if (!user?.id || !selectedEmotionId) return;
    setIsSubmittingCheckIn(true);
    try {
      await createLog({
        userId: user.id,
        emotion: selectedEmotionId,
        bodyRegions: [],
        preIntensity: 5,
        postIntensity: 5,
      });
      const todayStr = new Date().toISOString().split('T')[0];
      await SecureStore.setItemAsync(`last_checkin_date_${user.id}`, todayStr);
      setShowCheckInModal(false);
      Alert.alert("Mood Logged! 🌟", "Your application theme has updated to reflect your mood.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save your check-in. Please try again.");
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Floating Glows */}
      <View style={[styles.glowBall, { top: -50, right: -50, backgroundColor: colors.primary + '15' }]} />
      <View style={[styles.glowBall, { bottom: 100, left: -50, backgroundColor: colors.secondary + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.greeting}>Good Morning, {alias} 👋</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            {activeEmotionObj && (
              <View style={[styles.moodStatusBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.moodStatusText, { color: colors.primary }]}>
                  {activeEmotionObj.label}
                </Text>
              </View>
            )}
          </View>
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
                <Ionicons name="sparkles" size={18} color={colors.secondary} />
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
            colors={isScreeningComplete ? [colors.primary, colors.secondary] : ['#4F46E5', '#7C3AED']}
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
          <View style={[styles.heroGlow, { backgroundColor: colors.primary }]} />
        </View>

        {/* Stats Section */}
        {isScreeningComplete && (
          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.scoreValue}>{wsasScore}</Text>
              <Text style={styles.scoreLabel}>FUNCTIONING</Text>
            </View>

            <View style={styles.scoreCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="heart-outline" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.scoreValue}>{reqolScore}</Text>
              <Text style={styles.scoreLabel}>WELL-BEING</Text>
            </View>
          </View>
        )}

        {/* Clinical Appointments Section */}
        {isScreeningComplete && (
          <View style={styles.appointmentSection}>
            <Text style={styles.sectionTitle}>Clinical Appointments</Text>
            {!appointments || appointments.filter((appt: any) => appt.status === "scheduled").length === 0 ? (
              <View style={styles.appointmentCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(244, 246, 255, 0.95)'] as any}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.appointmentRow}>
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  <Text style={{ fontFamily: Theme.fontFamily.medium, fontSize: 14, color: colors.textSecondary, marginLeft: 10 }}>No upcoming appointments</Text>
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {appointments.filter((appt: any) => appt.status === "scheduled").map((appt: any) => {
                  const dateStr = new Date(appt.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = `${new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  return (
                    <View key={appt._id} style={styles.appointmentCard}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.95)', 'rgba(239, 246, 255, 0.95)'] as any}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.appointmentRow}>
                        <View style={[styles.appointmentIconCircle, { backgroundColor: colors.primary + '15' }]}>
                           <Ionicons name="calendar" size={22} color={colors.primary} />
                        </View>
                        <View style={styles.appointmentContent}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.appointmentDate}>{dateStr}</Text>
                            <View style={styles.liveBadge}>
                              <Text style={styles.liveBadgeText}>SCHEDULED</Text>
                            </View>
                          </View>
                          <Text style={styles.appointmentTime}>{timeStr}</Text>
                          
                          {/* Live Countdown Timer */}
                          <AppointmentCountdown 
                            startTime={appt.startTime} 
                            endTime={appt.endTime} 
                            colors={colors} 
                          />

                          {appt.description && (
                            <Text style={[styles.appointmentDesc, { marginTop: 6 }]} numberOfLines={2}>{appt.description}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
                    isFullWidth && { width: width - Theme.spacing.lg * 2, backgroundColor: '#FFFFFF' },
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
                        <Text style={[styles.toolTitle, isFullWidth && { textAlign: 'left', fontSize: 18, color: colors.text }]}>{tool.title}</Text>
                        <Text style={[styles.toolSub, isFullWidth && { textAlign: 'left', color: colors.primary }]}>{tool.sub}</Text>
                      </View>
                    </View>
                    {isFullWidth && (
                      <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Daily Check-In Modal Form */}
      <Modal
        visible={showCheckInModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Check-In 🌟</Text>
            <Text style={styles.modalSubtitle}>How are you feeling right now? We'll tailor your experience today.</Text>

            <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
              {EMOTIONS.map((emotion) => {
                const isSelected = selectedEmotionId === emotion.id;
                return (
                  <TouchableOpacity
                    key={emotion.id}
                    onPress={() => setSelectedEmotionId(emotion.id)}
                    style={[
                      styles.modalOptionCard,
                      isSelected && { borderColor: emotion.color, backgroundColor: emotion.color + '15' }
                    ]}
                  >
                    <Text style={[styles.modalOptionEmoji, isSelected && { transform: [{ scale: 1.1 }] }]}>
                      {emotion.label.split(' ')[0]}
                    </Text>
                    <Text style={[styles.modalOptionText, isSelected && { color: emotion.color, fontFamily: Theme.fontFamily.bold }]}>
                      {emotion.label.split(' ').slice(1).join(' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Skip"
                onPress={() => setShowCheckInModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Set Mood"
                onPress={handleCheckInSubmit}
                disabled={!selectedEmotionId}
                loading={isSubmittingCheckIn}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const stylesFactory = (colors: any) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  } as const,
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
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
    color: colors.textSecondary,
  },
  moodStatusBadge: {
    borderWidth: 1.5,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  moodStatusText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 13,
  },
  growthSection: {
    marginBottom: Theme.spacing.xl,
  },
  growthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.tertiary,
    gap: 12,
  },
  growthIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  growthContent: {
    flex: 1,
  },
  growthTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  growthMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  heroContainer: {
    marginBottom: Theme.spacing.xl,
    position: 'relative',
  } as const,
  heroCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    minHeight: 180,
    ...Theme.shadows.primary,
  },
  heroContent: {
    justifyContent: 'center',
  } as const,
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
  } as const,
  moodText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.md,
    color: colors.white,
  },
  heroMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 22,
    color: colors.white,
    lineHeight: 30,
  },
  heroGlow: {
    position: 'absolute',
    bottom: -15,
    left: '10%',
    width: '80%',
    height: 40,
    opacity: 0.15,
    borderRadius: 40,
  } as const,
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Theme.spacing.xl,
  } as const,
  scoreCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadows.secondary,
  } as const,
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  } as const,
  scoreValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 24,
    color: colors.text,
  },
  scoreLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  } as const,
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: Theme.spacing.md,
    marginTop: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  } as const,
  toolCard: {
    width: (width - Theme.spacing.lg * 2 - 16) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadows.tertiary,
  } as const,
  toolIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  } as const,
  toolEmoji: {
    fontSize: 32,
  },
  toolTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    textAlign: 'center',
  },
  toolSub: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
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
  } as const,
  progressTag: {
    marginBottom: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.secondary,
  } as const,
  progressTagGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 14,
  } as const,
  progressTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  } as const,
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
  } as const,
  progressCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  } as const,
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
  // Modal check-in styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.primary,
  },
  modalTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 16,
  } as const,
  modalOptionCard: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 80,
  } as const,
  modalOptionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  modalOptionText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  } as const,
  appointmentSection: {
    marginBottom: Theme.spacing.xl,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    ...Theme.shadows.tertiary,
    marginBottom: 10,
    position: 'relative',
  } as const,
  appointmentRow: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
  } as const,
  appointmentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  appointmentContent: {
    flex: 1,
  },
  appointmentDate: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: colors.text,
  },
  appointmentTime: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appointmentDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  liveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 9,
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  } as const,
  timerBadgeText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});


