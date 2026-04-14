import "@/global.css";
import { useSignIn } from "@clerk/expo";
import clsx from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const passwordRef = useRef<TextInput>(null);

  const emailErr =
    touched.email && !isValidEmail(email)
      ? "Enter a valid email address"
      : null;
  const passwordErr =
    touched.password && password.length < 8
      ? "Password must be at least 8 characters"
      : null;

  // Surface Clerk's server-side field errors
  const clerkEmailErr = errors?.fields?.identifier?.message ?? null;
  const clerkPasswordErr = errors?.fields?.password?.message ?? null;

  const canSubmit =
    isValidEmail(email) && password.length >= 8 && fetchStatus !== "fetching";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Mark both fields touched so any validation errors show
    setTouched({ email: true, password: true });

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (!url.startsWith("http")) {
            router.replace(url as Href);
          }
        },
      });
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ────────────────────────────────────────────── */}
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">Smart Billing</Text>
              </View>
            </View>

            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to continue managing{"\n"}your subscriptions
            </Text>
          </View>

          {/* ── Form card ─────────────────────────────────────────── */}
          <View className="auth-card">
            <View className="auth-form">
              {/* Email */}
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={clsx(
                    "auth-input",
                    (emailErr || clerkEmailErr) && "auth-input-error",
                  )}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  value={email}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(8,17,38,0.35)"
                  onChangeText={setEmail}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {(emailErr || clerkEmailErr) && (
                  <Text className="auth-error">
                    {emailErr ?? clerkEmailErr}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <View className="relative">
                  <TextInput
                    ref={passwordRef}
                    className={clsx(
                      "auth-input",
                      (passwordErr || clerkPasswordErr) && "auth-input-error",
                    )}
                    value={password}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    textContentType="password"
                    onChangeText={setPassword}
                    onBlur={() =>
                      setTouched((t) => ({ ...t, password: true }))
                    }
                    onSubmitEditing={handleSubmit}
                    // Extra right padding to avoid text overlapping the toggle
                    style={{ paddingRight: 60 }}
                  />
                  <Pressable
                    style={{
                      position: "absolute",
                      right: 16,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                    }}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}
                  >
                    <Text className="text-sm font-sans-semibold text-muted-foreground">
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
                {(passwordErr || clerkPasswordErr) && (
                  <Text className="auth-error">
                    {passwordErr ?? clerkPasswordErr}
                  </Text>
                )}
              </View>

              {/* Submit */}
              <Pressable
                className={clsx(
                  "auth-button",
                  !canSubmit && "auth-button-disabled",
                )}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text className="auth-button-text">
                  {fetchStatus === "fetching" ? "Signing in…" : "Sign in"}
                </Text>
              </Pressable>

              {/* Divider */}
              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">or</Text>
                <View className="auth-divider-line" />
              </View>

              {/* Link to sign-up */}
              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Recurly?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="auth-link"> Create an account</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
