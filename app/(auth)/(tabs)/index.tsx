import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { getDisplayLevel } from "@/utils/triage";
import { generateInsightMessage } from "@/utils/insights";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const appUser = useQuery(api.users.getByClerkId, {
    clerkId: clerkUser?.id ?? "",
  });

  const latestScreening = useQuery(api.screening.getLatest, {
    userId: clerkUser?.id ?? "",
  });

  const latestTriage = useQuery(api.triage.getLatest, {
    userId: clerkUser?.id ?? "",
  });

  const recentEmotions = useQuery(api.emotionLogs.getRecent, {
    userId: clerkUser?.id ?? "",
  });

  const recentJpmr = useQuery(api.jpmrLogs.getRecent, {
    userId: clerkUser?.id ?? "",
  });

  const reinforcement = useQuery(api.reinforcement.generatePositiveMessage, {
    userId: clerkUser?.id ?? "",
  });

  const updateWellness = useMutation(api.wellness.updateProfile);

  React.useEffect(() => {
    if (clerkUser?.id) {
      updateWellness({ userId: clerkUser.id });
    }
  }, [clerkUser?.id]);

  if (appUser === undefined || latestScreening === undefined || latestTriage === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const alias = appUser?.alias || "there";
  const displayLevel = latestTriage ? getDisplayLevel(latestTriage.level as any) : "Unknown";
  
  const wsasScore = latestScreening?.wsas_total ?? 0;
  const reqolScore = latestScreening?.reqol10_total ?? 0;

  const { recommendation } = generateInsightMessage({
    triage_level: latestTriage?.level as any || 'mild',
    wsas_total: wsasScore,
    reqol10_total: reqolScore,
    alias,
    recentEmotions: recentEmotions ?? [],
    recentTools: recentJpmr ?? [],
  });

  const isSevere = latestTriage && ["severe", "suicide_flag", "psychosis_flag"].includes(latestTriage.level);

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

        {/* Positive Reinforcement Section */}
        {reinforcement && (
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
            colors={[Colors.primary, Colors.secondary]}
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

        <Text style={styles.sectionTitle}>Therapeutic Tools</Text>

        {/* Tools Grid */}
        <View style={styles.toolsGrid}>
          {[
            { id: 'emotion-map', title: 'Quick Check', sub: 'Body Scan', icon: '🗺️', route: '/(auth)/tools/emotion-map' },
            { id: 'jpmr', title: 'Relax Now', sub: 'Relaxation', icon: '🧘', route: '/(auth)/tools/jpmr' },
            { id: 'reframe', title: 'Reframe Now', sub: 'Thoughts', icon: '🧠', route: '/(auth)/tools/reframe', restricted: isSevere },
            { id: 'microgoals', title: 'MicroGoals', sub: 'Habits', icon: '🎯', route: '/(auth)/tools/microgoals' },
          ].map((tool, index) => (
            <View key={tool.id}>
              <TouchableOpacity 
                style={[styles.toolCard, tool.restricted && { opacity: 0.6 }]} 
                activeOpacity={0.9} 
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => {
                  if (tool.restricted) {
                    Alert.alert("Counselor Recommended", "This tool is best used with professional guidance during high distress.");
                  } else {
                    router.push(tool.route as any);
                  }
                }}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                  <View style={styles.toolIconContainer}>
                    <Text style={styles.toolEmoji}>{tool.icon}</Text>
                  </View>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolSub}>{tool.sub}</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          ))}
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
});
