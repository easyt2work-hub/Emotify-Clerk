import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, ViewStyle, TextStyle } from "react-native";
import { useAppAuth } from "@/utils/auth";
//import { useLoadingVideo, usePageLoading } from "@/context/LoadingVideoContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemeColors, useStyles } from "@/context/MoodThemeContext";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const { user } = useAppAuth();
  const colors = useThemeColors();
  const styles = useStyles(stylesFactory);

  const stats = useQuery(api.insights.getDailyStats, {
    userId: user?.id ?? "",
  });

  //usePageLoading(stats === undefined);

  if (stats === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Data prep for charts
  const rawEmotions = [...stats.emotionLogs].sort((a, b) => a.createdAt - b.createdAt).slice(-7);
  const emotionLabels = rawEmotions.length > 0 ? rawEmotions.map((log: any) => new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'short' })) : ["-"];
  const emotionData = rawEmotions.length > 0 ? rawEmotions.map((log: any) => log.preIntensity || 0) : [0];

  const chartConfig = {
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, ${opacity})`,
    labelColor: (opacity = 1) => colors.textMuted,
    strokeWidth: 3,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.white
    },
    propsForBackgroundLines: {
      strokeDasharray: "5, 5",
      stroke: "rgba(0,0,0,0.05)"
    },
    fillShadowGradient: colors.primary,
    fillShadowGradientOpacity: 0.1,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.backgroundGradient as any}
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
            colors={[colors.primary, colors.secondary]}
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
          <View style={[styles.heroGlow, { backgroundColor: colors.primary }]} />
        </View>

        {/* Improvement Banner */}
        <View style={styles.improvementCard}>
          <View style={[styles.improvementIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="sparkles" size={20} color={colors.success} />
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
                color: (opacity = 1) => colors.primary,
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
          <StatCard icon="leaf" color={colors.primary} value={stats.reframesCount} label="REFRAMES" styles={styles} />
          <StatCard icon="time" color={colors.secondary} value={`${stats.jpmrMinutes}m`} label="RELAXATION" styles={styles} />
          <StatCard icon="heart" color={colors.accent} value={stats.totalCheckins} label="CHECK-INS" styles={styles} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, color, value, label, styles }: any) {
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

const stylesFactory = (colors: any) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  content: {
    padding: Theme.spacing.lg,
    paddingTop: 60,
  } as ViewStyle,
  header: {
    marginBottom: Theme.spacing.xl,
  } as ViewStyle,
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  } as TextStyle,
  subtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 15,
    color: colors.textSecondary,
  } as TextStyle,
  summaryCard: {
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.primary,
    zIndex: 1,
  } as ViewStyle,
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  } as ViewStyle,
  summaryItem: {
    alignItems: 'center',
  } as ViewStyle,
  summaryValue: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 34,
    color: colors.white,
    marginBottom: 2,
  } as TextStyle,
  summaryLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
  } as TextStyle,
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  } as ViewStyle,
  heroGlow: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    width: '70%',
    height: 30,
    opacity: 0.15,
    borderRadius: 40,
  } as ViewStyle,
  improvementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.tertiary,
    gap: 12,
  } as ViewStyle,
  improvementIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  improvementText: {
    flex: 1,
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    color: colors.text,
  } as TextStyle,
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: Theme.spacing.md,
    marginTop: 8,
  } as TextStyle,
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: 16,
    paddingRight: 24,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.secondary,
  } as ViewStyle,
  chart: {
    borderRadius: Theme.borderRadius.lg,
    marginLeft: -12,
  } as ViewStyle,
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadows.tertiary,
  } as ViewStyle,
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  statNumber: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 20,
    color: colors.text,
  } as TextStyle,
  statLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  } as TextStyle,
});
