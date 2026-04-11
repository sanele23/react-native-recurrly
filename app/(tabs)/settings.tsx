import { styled } from "nativewind";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView); // Create a styled version of SafeAreaView for consistent styling

const Settings = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-bold text-success">Settings</Text>
    </SafeAreaView>
  );
};

export default Settings;
