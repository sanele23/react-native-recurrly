import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { styled } from "nativewind";
import React, { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const { subscriptions } = useSubscriptionsStore();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.plan?.toLowerCase().includes(q),
    );
  }, [query, subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-bold text-foreground mb-4">
        Subscriptions
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search subscriptions..."
        placeholderTextColor="#9ca3af"
        clearButtonMode="while-editing"
        className="bg-card text-foreground rounded-xl px-4 py-3 mb-5 text-sm"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((current) =>
                current === item.id ? null : item.id,
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions found.</Text>
        }
        contentContainerClassName="pb-10"
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
