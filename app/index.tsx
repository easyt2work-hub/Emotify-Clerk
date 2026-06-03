import { Redirect } from "expo-router";
import { useAppAuth } from "@/utils/auth";

export default function Index() {
  const { isAuthenticated } = useAppAuth();

  if (isAuthenticated) {
    return <Redirect href="/(auth)/(tabs)" />;
  }

  return <Redirect href="/(public)/login" />;
}
