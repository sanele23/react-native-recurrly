import { icons } from "@/constants/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f5a9b8",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#ffd6a5",
  Cloud: "#caffbf",
  Music: "#fdffb6",
  Other: "#e8e8e8",
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
  const [category, setCategory] = useState<Category>("Other");

  const parsedPrice = parseFloat(price);
  const isValid = name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

  function handleSubmit() {
    if (!isValid) return;
    const now = dayjs();
    const renewalDate =
      frequency === "Monthly"
        ? now.add(1, "month").toISOString()
        : now.add(1, "year").toISOString();

    onSubmit({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      price: parsedPrice,
      billing: frequency,
      frequency,
      category,
      status: "active",
      startDate: now.toISOString(),
      renewalDate,
      icon: icons.wallet,
      color: CATEGORY_COLORS[category],
    });

    resetForm();
  }

  function resetForm() {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetForm}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="modal-overlay" onPress={resetForm}>
          <Pressable className="modal-container" onPress={() => {}}>
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={resetForm}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="gap-5 p-5 pb-8"
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className="auth-input"
                  placeholder="e.g. Netflix"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className="auth-input"
                  placeholder="0.00"
                  placeholderTextColor="rgba(0,0,0,0.35)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((opt) => (
                    <Pressable
                      key={opt}
                      className={clsx(
                        "picker-option",
                        frequency === opt && "picker-option-active",
                      )}
                      onPress={() => setFrequency(opt)}
                    >
                      <Text
                        className={clsx(
                          "picker-option-text",
                          frequency === opt && "picker-option-text-active",
                        )}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      className={clsx(
                        "category-chip",
                        category === cat && "category-chip-active",
                      )}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          category === cat && "category-chip-text-active",
                        )}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                className={clsx("auth-button", !isValid && "auth-button-disabled")}
                onPress={handleSubmit}
                disabled={!isValid}
              >
                <Text className="auth-button-text">Add Subscription</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
