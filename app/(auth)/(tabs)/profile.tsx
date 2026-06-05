import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Dimensions, ViewStyle, TextStyle } from "react-native";
import { useAppAuth } from "@/utils/auth";
//import { useLoadingVideo, usePageLoading } from "@/context/LoadingVideoContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemeColors, useStyles } from "@/context/MoodThemeContext";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { logout, user } = useAppAuth();
  //const { showLoadingVideo } = useLoadingVideo();
  const router = useRouter();
  const userId = user?.id;
  const colors = useThemeColors();
  const styles = useStyles(stylesFactory);

  const dbUser = useQuery(api.users.getByClerkId, userId ? { clerkId: userId } : "skip");
  const exportData = useQuery(api.insights.getDailyStats, userId ? { userId: userId } : "skip");

  const [isExporting, setIsExporting] = useState(false);

  const wellnessProfile = useQuery(api.wellness.getProfile, { userId: userId ?? "" });
  const updateWellness = useMutation(api.wellness.updateProfile);

  // Hook up page loading state to Convex query fetching
  const isProfileLoading = dbUser === undefined || exportData === undefined || wellnessProfile === undefined;
  //usePageLoading(isProfileLoading);

  React.useEffect(() => {
    if (userId) {
      updateWellness({ userId });
    }
  }, [userId]);

  const handleSignOut = async () => {
    try {
      //await showLoadingVideo(logout());
      await logout();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };


  const handleExportData = async () => {
    if (!exportData || !userId) return;
    setIsExporting(true);

    try {
      const csvRows = [];
      csvRows.push("Screening Data");
      csvRows.push("UserID,PHQ9,GAD7,PQ16,WSAS,ReQoL10,Item9,Date");
      exportData.screenings.forEach((s: any) => {
        csvRows.push(`${userId},${s.phq9_total},${s.gad7_total},${s.pq16_total},${s.wsas_total},${s.reqol10_total},${s.phq9_item9_score},${new Date(s.createdAt).toISOString()}`);
      });
      csvRows.push("");

      const csvString = csvRows.join("\n");
      const fileUri = FileSystem.documentDirectory + "emotify_data_export.csv";

      await FileSystem.writeAsStringAsync(fileUri, csvString, {
        encoding: "utf8",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Success", "Data exported locally to: " + fileUri);
      }
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert("Error", "Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!dbUser) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const email = dbUser.email || "No email";
  const initial = dbUser.alias ? dbUser.alias.charAt(0).toUpperCase() : "U";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Signature Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={[styles.avatarGlow, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={styles.nameText}>{dbUser.alias || "User"}</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={[styles.headerMessage, { color: colors.primary }]}>You’re doing great — keep going 🌱</Text>
        </View>

        {/* Wellness Identity Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR WELLNESS IDENTITY</Text>
            <Text style={styles.sectionSubtitle}>Updated today based on your activity</Text>
          </View>

          <View style={styles.identityGrid}>
            <IdentityCard
              icon="leaf"
              label="PERSONAL STYLE"
              color={colors.primary}
              traits={wellnessProfile?.personality_traits}
              loading={!wellnessProfile}
              styles={styles}
            />
            <IdentityCard
              icon="chatbubble"
              label="MOOD PATTERN"
              color={colors.secondary}
              value={wellnessProfile?.mood_pattern}
              loading={!wellnessProfile}
              styles={styles}
            />
            <IdentityCard
              icon="flash"
              label="ENERGY PATTERN"
              color={colors.accent}
              value={wellnessProfile?.energy_pattern}
              loading={!wellnessProfile}
              styles={styles}
            />
            <IdentityCard
              icon="checkmark-circle"
              label="GOALS"
              color={colors.warning}
              traits={wellnessProfile?.wellness_goals}
              loading={!wellnessProfile}
              styles={styles}
            />
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.premiumCard}>
            <DetailRow icon="person-outline" label="Age" value={dbUser.age?.toString() || "-"} colors={colors} styles={styles} />
            <View style={styles.divider} />
            <DetailRow icon="school-outline" label="Campus" value={dbUser.campus || "-"} colors={colors} styles={styles} />
            <View style={styles.divider} />
            <DetailRow icon="business-outline" label="Department" value={dbUser.department || "-"} colors={colors} styles={styles} />
          </View>
        </View>

        {/* Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SESSIONS</Text>
          <View style={styles.premiumCard}>
            <DetailRow
              icon="time-outline"
              label="Last Login"
              value={dbUser.lastLoginAt ? new Date(dbUser.lastLoginAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Just now"}
              colors={colors}
              styles={styles}
            />
          </View>
        </View>


        <View style={{ height: 40 }} />
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutBtn}
          textStyle={{ color: colors.error }}
          icon={<Ionicons name="log-out-outline" size={20} color={colors.error} />}
        />

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function IdentityCard({ icon, label, color, traits, value, loading, styles }: any) {
  return (
    <View style={styles.idCard}>
      <View style={[styles.idIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.idLabel}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={color} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
      ) : (
        <View style={styles.idContent}>
          {traits ? (
            traits.map((t: string, i: number) => (
              <View key={i} style={styles.idTraitRow}>
                <Ionicons name="checkmark" size={12} color={color} />
                <Text style={styles.idValueText}>{t}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.idValueTextMain}>{value}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function DetailRow({ icon, label, value, colors, styles }: { icon: any; label: string; value: string; colors: any; styles: any }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
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
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  } as ViewStyle,
  avatarWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.lg,
  } as ViewStyle,
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  } as ViewStyle,
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.2,
    ...Theme.shadows.premium,
    zIndex: 1,
  } as ViewStyle,
  avatarText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 40,
    color: colors.white,
  } as TextStyle,
  nameText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  } as TextStyle,
  emailText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
  } as TextStyle,
  headerMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  } as TextStyle,
  section: {
    marginBottom: Theme.spacing.xl,
  } as ViewStyle,
  sectionHeader: {
    marginBottom: Theme.spacing.md,
    marginLeft: 4,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  } as TextStyle,
  identityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  } as ViewStyle,
  idCard: {
    width: (width - Theme.spacing.lg * 2 - 12) / 2,
    backgroundColor: colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.secondary,
  } as ViewStyle,
  idIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  idLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  } as TextStyle,
  idContent: {
    marginTop: 8,
    gap: 6,
  } as ViewStyle,
  idTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  idValueText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    color: colors.text,
  } as TextStyle,
  idValueTextMain: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    color: colors.text,
  } as TextStyle,
  premiumCard: {
    backgroundColor: colors.white,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.tertiary,
    overflow: 'hidden',
  } as ViewStyle,
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.lg,
  } as ViewStyle,
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  icon: {
    marginRight: Theme.spacing.md,
  } as ViewStyle,
  label: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: colors.text,
  } as TextStyle,
  value: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: colors.textSecondary,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: Theme.spacing.lg,
  } as ViewStyle,
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.lg,
  } as ViewStyle,
  signOutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: Theme.borderRadius.lg,
    marginTop: 20,
  } as ViewStyle,
});
