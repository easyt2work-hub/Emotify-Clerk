import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

export default function ToolsScreen() {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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
      color: Colors.primary,
    },
    {
      id: "jpmr",
      title: "Relax Now",
      description: "Guided deep physical relaxation.",
      emoji: "🧘",
      route: "/(auth)/tools/jpmr" as const,
      color: Colors.secondary,
    },
    {
      id: "reframe",
      title: "Reframe",
      description: "Balance negative thinking patterns.",
      emoji: "🧠",
      route: "/(auth)/tools/reframe" as const,
      color: Colors.accent,
    },
    {
      id: "microgoals",
      title: "MicroGoals",
      description: "Daily habits for small wins.",
      emoji: "🎯",
      route: "/(auth)/tools/microgoals" as const,
      color: "#F59E0B",
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
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
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Empty State / Bottom Message */}
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={Colors.textMuted} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={styles.emptyText}>Start your first check-in today 🌱</Text>
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
  list: {
    gap: 12,
  },
  cardWrapper: {
    borderRadius: Theme.borderRadius.xl,
  },
  glassCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.tertiary,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  toolTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 2,
  },
  toolDesc: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
