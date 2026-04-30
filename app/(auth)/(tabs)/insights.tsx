import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const { user: clerkUser } = useUser();

  const stats = useQuery(api.insights.getDailyStats, {
    userId: clerkUser?.id ?? "",
  });

  if (stats === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Data prep for charts
  const rawEmotions = [...stats.emotionLogs].sort((a, b) => a.createdAt - b.createdAt).slice(-7);
  const emotionLabels = rawEmotions.length > 0 ? rawEmotions.map((log: any) => new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'short' })) : ["-"];
  const emotionData = rawEmotions.length > 0 ? rawEmotions.map((log: any) => log.preIntensity || 0) : [0];

  const chartConfig = {
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 92, 255, ${opacity})`,
    labelColor: (opacity = 1) => Colors.textMuted,
    strokeWidth: 3,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: Colors.white
    },
    propsForBackgroundLines: {
      strokeDasharray: "5, 5",
      stroke: "rgba(0,0,0,0.05)"
    },
    fillShadowGradient: Colors.primary,
    fillShadowGradientOpacity: 0.1,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>Tracking your path to emotional balance.</Text>
        </View>

        {/* Highlight Summary */}
        <View>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.totalCalmPoints}</Text>
                <Text style={styles.summaryLabel}>CALM POINTS</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.completedGoalsCount}</Text>
                <Text style={styles.summaryLabel}>GOALS MET</Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.heroGlow} />
        </View>

        {/* Improvement Banner */}
        <View style={styles.improvementCard}>
          <View style={styles.improvementIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          </View>
          <Text style={styles.improvementText}>
            You’ve improved this week ✨ Keep taking small steps.
          </Text>
        </View>

        {/* Mood Trend Chart */}
        <Text style={styles.sectionTitle}>Mood Trend</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={{
              labels: emotionLabels,
              datasets: [{ 
                data: emotionData,
                color: (opacity = 1) => Colors.primary,
                strokeWidth: 4
              }]
            }}
            width={width - Theme.spacing.lg * 2 - 32}
            height={200}
            chartConfig={chartConfig}
            bezier
            withHorizontalLines={true}
            withVerticalLines={false}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            style={styles.chart}
          />
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Activity Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="leaf" color="#7C5CFF" value={stats.reframesCount} label="REFRAMES" delay={600} />
          <StatCard icon="time" color="#00C2FF" value={`${stats.jpmrMinutes}m`} label="RELAXATION" delay={700} />
          <StatCard icon="heart" color="#FFB6C1" value={stats.totalCheckins} label="CHECK-INS" delay={800} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, color, value, label, delay }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  content: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.primary,
    zIndex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 34,
    color: Colors.white,
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroGlow: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    width: '70%',
    height: 30,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    borderRadius: 40,
  },
  improvementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.tertiary,
    gap: 12,
  },
  improvementIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  improvementText: {
    flex: 1,
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Theme.spacing.md,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    paddingRight: 24,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.secondary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  chart: {
    borderRadius: Theme.borderRadius.lg,
    marginLeft: -12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.tertiary,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
