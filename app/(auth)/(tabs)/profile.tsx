import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert, TouchableOpacity, Dimensions } from "react-native";
import { useAppAuth } from "@/utils/auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { logout, user } = useAppAuth();
  const router = useRouter();
  const userId = user?.id;
  const dbUser = useQuery(api.users.getByClerkId, userId ? { clerkId: userId } : "skip");
  const toggleBiometric = useMutation(api.users.toggleBiometric);
  const exportData = useQuery(api.insights.getDailyStats, userId ? { userId: userId } : "skip");

  const [isUpdatingBiometric, setIsUpdatingBiometric] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const wellnessProfile = useQuery(api.wellness.getProfile, { userId: userId ?? "" });
  const updateWellness = useMutation(api.wellness.updateProfile);

  React.useEffect(() => {
    if (userId) {
      updateWellness({ userId });
    }
  }, [userId]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleToggleBiometric = async (newValue: boolean) => {
    if (!userId) return;
    setIsUpdatingBiometric(true);

    try {
      if (newValue) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert("Error", "Your device does not support or have biometrics set up.");
          setIsUpdatingBiometric(false);
          return;
        }
      }

      await toggleBiometric({ clerkId: userId, enabled: newValue });
    } catch (err) {
      console.error("Biometric toggle error:", err);
    } finally {
      setIsUpdatingBiometric(false);
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

  if (!dbUser) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const email = dbUser.email || "No email";
  const initial = dbUser.alias ? dbUser.alias.charAt(0).toUpperCase() : "U";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Signature Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={styles.avatarGlow} />
          </View>
          <Text style={styles.nameText}>{dbUser.alias || "User"}</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.headerMessage}>You’re doing great — keep going 🌱</Text>
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
              color="#7C5CFF"
              traits={wellnessProfile?.personality_traits}
              loading={!wellnessProfile}
              delay={300}
            />
            <IdentityCard
              icon="chatbubble"
              label="MOOD PATTERN"
              color="#FFB6C1"
              value={wellnessProfile?.mood_pattern}
              loading={!wellnessProfile}
              delay={400}
            />
            <IdentityCard
              icon="flash"
              label="ENERGY PATTERN"
              color="#F59E0B"
              value={wellnessProfile?.energy_pattern}
              loading={!wellnessProfile}
              delay={500}
            />
            <IdentityCard
              icon="checkmark-circle"
              label="GOALS"
              color="#00C2FF"
              traits={wellnessProfile?.wellness_goals}
              loading={!wellnessProfile}
              delay={600}
            />
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.premiumCard}>
            <DetailRow icon="person-outline" label="Age" value={dbUser.age?.toString() || "-"} />
            <View style={styles.divider} />
            <DetailRow icon="school-outline" label="Campus" value={dbUser.campus || "-"} />
            <View style={styles.divider} />
            <DetailRow icon="business-outline" label="Department" value={dbUser.department || "-"} />
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
            />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.premiumCard}>
            <View style={styles.switchRow}>
              <View style={styles.rowLeft}>
                <Ionicons name="finger-print-outline" size={20} color={Colors.primary} style={styles.icon} />
                <Text style={styles.label}>Biometric Lock</Text>
              </View>
              <Switch
                value={dbUser.biometricEnabled}
                onValueChange={handleToggleBiometric}
                disabled={isUpdatingBiometric}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutBtn}
          textStyle={{ color: Colors.error }}
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.error} />}
        />

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

function IdentityCard({ icon, label, color, traits, value, loading, delay }: any) {
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

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
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
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.lg,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    ...Theme.shadows.premium,
    zIndex: 1,
  },
  avatarText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 40,
    color: Colors.white,
  },
  nameText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    marginBottom: 4,
  },
  emailText: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  headerMessage: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: Theme.spacing.md,
    marginLeft: 4,
  },
  sectionTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  identityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  idCard: {
    width: (width - Theme.spacing.lg * 2 - 12) / 2,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.secondary,
  },
  idIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  idLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  idContent: {
    marginTop: 8,
    gap: 6,
  },
  idTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idValueText: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  idValueTextMain: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 17,
    color: Colors.text,
  },
  premiumCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    ...Theme.shadows.tertiary,
    overflow: 'hidden',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: Theme.spacing.md,
  },
  label: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: Colors.text,
  },
  value: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: Theme.spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  signOutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: Theme.borderRadius.lg,
    marginTop: 20,
  },
});
