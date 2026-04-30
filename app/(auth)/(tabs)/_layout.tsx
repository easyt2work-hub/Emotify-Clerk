import { Tabs, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { View, Text, StyleSheet, Linking, Alert, Platform, TouchableOpacity } from "react-native";
import { Button } from "@/components/ui/Button";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const appUser = useQuery(api.users.getByClerkId, {
    clerkId: clerkUser?.id ?? "",
  });

  const latestTriage = useQuery(api.triage.getLatest, {
    userId: clerkUser?.id ?? "",
  });

  const createAlert = useMutation(api.alerts.createAlert);

  const isEmergency = latestTriage?.level === "suicide_flag";

  const handleTalkToCounselor = async () => {
    if (!clerkUser) return;
    await createAlert({ userId: clerkUser.id, type: "counselor_request" });
    Alert.alert("Request Sent", "A counselor has been notified and will reach out to you shortly.");
  };

  if (isEmergency) {
    return (
      <View style={[styles.container, { padding: Theme.spacing.xl, paddingTop: 80, backgroundColor: Colors.white }]}>
        <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 20 }}>⚠️</Text>
        <Text style={[styles.emergencyTitle, { color: Colors.error, textAlign: 'center' }]}>Safety Priority</Text>
        <Text style={[styles.emergencyText, { textAlign: 'center', marginVertical: Theme.spacing.xl, fontSize: 18 }]}>
          We're concerned for your safety. If you're in danger now, please call emergency services immediately.
        </Text>
        
        <View style={{ gap: Theme.spacing.md }}>
          <Button 
            title="Call Emergency Services" 
            onPress={() => Linking.openURL('tel:911')} 
            variant="danger" 
            size="lg" 
          />
          {appUser?.emergencyContactPhone && (
            <Button 
              title={`Call ${appUser.emergencyContactName || 'Emergency Contact'}`} 
              onPress={() => Linking.openURL(`tel:${appUser.emergencyContactPhone}`)} 
              variant="outline" 
              size="lg" 
            />
          )}
          <Button 
            title="Talk to Counsellor Now" 
            onPress={handleTalkToCounselor} 
            variant="outline" 
            size="lg" 
          />
          <View style={{ height: 40 }} />
          <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginBottom: 10 }}>Or try a grounding exercise:</Text>
          <Button 
            title="Listen to Relaxation Audio" 
            onPress={() => router.push("/(auth)/tools/jpmr")} 
            size="lg" 
          />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.95)' }]} />
          )
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "apps" : "apps-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...Theme.shadows.tertiary,
    elevation: 8,
    overflow: 'hidden',
  },
  tabBarLabel: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: 10,
    marginTop: 4,
  },
  emergencyTitle: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.xxl,
  },
  emergencyText: {
    fontFamily: Theme.fontFamily.medium,
    color: Colors.text,
  }
});
