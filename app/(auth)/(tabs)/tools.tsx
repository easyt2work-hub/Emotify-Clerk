import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, ViewStyle, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors, useStyles } from "@/context/MoodThemeContext";
// import { usePageLoading } from "@/context/LoadingVideoContext";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

export default function ToolsScreen() {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const colors = useThemeColors();
  const styles = useStyles(stylesFactory);

  //usePageLoading(false);

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

  const tools = [
    {
      id: "emotion-map",
      title: "Emotion Map",
      description: "Map your feelings to body regions.",
      emoji: "🗺️",
      route: "/(auth)/tools/emotion-map" as const,
      color: colors.primary,
    },
    {
      id: "jpmr",
      title: "Relax Now",
      description: "Guided deep physical relaxation.",
      emoji: "🧘",
      route: "/(auth)/tools/jpmr" as const,
      color: colors.secondary,
    },
    {
      id: "reframe",
      title: "Reframe",
      description: "Balance negative thinking patterns.",
      emoji: "🧠",
      route: "/(auth)/tools/reframe" as const,
      color: colors.accent,
    },
    {
      id: "microgoals",
      title: "MicroGoals",
      description: "Daily habits for small wins.",
      emoji: "🎯",
      route: "/(auth)/tools/microgoals" as const,
      color: colors.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Therapy Hub</Text>
          <Text style={styles.subtitle}>Curated tools for your mental resilience.</Text>
        </View>

        <View style={styles.list}>
          {tools.map((tool, index) => (
            <View key={tool.id}>
              <TouchableOpacity
                style={styles.cardWrapper}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => router.push(tool.route)}
              >
                <Animated.View style={[styles.glassCard, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={[styles.iconBox, { backgroundColor: tool.color + '10' }]}>
                    <Text style={styles.emoji}>{tool.emoji}</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDesc}>{tool.description}</Text>
                  </View>
                  <View style={styles.arrowBox}>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Empty State / Bottom Message */}
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={colors.textMuted} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={styles.emptyText}>Start your first check-in today 🌱</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const stylesFactory = (colors: any) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  list: {
    gap: 12,
  } as ViewStyle,
  cardWrapper: {
    borderRadius: Theme.borderRadius.xl,
  } as ViewStyle,
  glassCard: {
    backgroundColor: colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Theme.shadows.tertiary,
  } as ViewStyle,
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: colors.white,
  } as ViewStyle,
  emoji: {
    fontSize: 24,
  } as TextStyle,
  textContainer: {
    flex: 1,
  } as ViewStyle,
  toolTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 2,
  } as TextStyle,
  toolDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  } as TextStyle,
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  } as ViewStyle,
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  } as TextStyle,
});
