import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || "?";

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).replace(/\//g, ".") + "."
    : "—";

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-2xl font-sans-bold text-primary mb-6">Settings</Text>

      {/* User profile card */}
      <View className="rounded-2xl border border-border bg-card p-4 flex-row items-center gap-4 mb-4">
        <View className="size-14 rounded-2xl bg-accent items-center justify-center">
          <Text className="text-xl font-sans-extrabold text-background">
            {initials}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-sans-bold text-primary">
            {user?.fullName ?? "—"}
          </Text>
          <Text className="text-sm font-sans-medium text-muted-foreground">
            {email}
          </Text>
        </View>
      </View>

      {/* Account card */}
      <View className="rounded-2xl border border-border bg-card p-4 gap-3 mb-6">
        <Text className="text-base font-sans-bold text-primary mb-1">Account</Text>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-medium text-muted-foreground">Account ID</Text>
          <Text className="text-sm font-sans-semibold text-primary" numberOfLines={1}>
            {user?.id ? user.id.slice(0, 20) + "…" : "—"}
          </Text>
        </View>

        <View className="h-px bg-border" />

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-sans-medium text-muted-foreground">Joined</Text>
          <Text className="text-sm font-sans-semibold text-primary">{joinedDate}</Text>
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        onPress={handleSignOut}
        className="rounded-2xl bg-accent py-4 items-center"
      >
        <Text className="text-base font-sans-bold text-primary">Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
