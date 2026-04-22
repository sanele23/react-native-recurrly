import "@/global.css";
import { useSignIn } from "@clerk/expo";
import clsx from "clsx";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useRef, useState } from "react";
import { usePostHog } from "posthog-react-native";
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

type MFAStrategy = "totp" | "phone_code" | "email_code" | "backup_code";

function mfaSubtitle(strategy: MFAStrategy): string {
  switch (strategy) {
    case "totp":
      return "Enter the 6-digit code from your authenticator app.";
    case "phone_code":
      return "Enter the code sent to your phone number.";
    case "email_code":
      return "Enter the code sent to your email address.";
    case "backup_code":
      return "Enter one of your saved backup codes.";
  }
}

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const posthog = usePostHog();

  // ── Password step state ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [generalError, setGeneralError] = useState<string | null>(null);

  // ── MFA step state ───────────────────────────────────────────────────────
  const [isMFAStep, setIsMFAStep] = useState(false);
  const [mfaStrategy, setMfaStrategy] = useState<MFAStrategy | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaCodeTouched, setMfaCodeTouched] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const mfaCodeRef = useRef<TextInput>(null);

  // ── Validation ───────────────────────────────────────────────────────────
  const emailErr =
    touched.email && !isValidEmail(email)
      ? "Enter a valid email address"
      : null;
  const passwordErr =
    touched.password && password.length < 8
      ? "Password must be at least 8 characters"
      : null;

  const clerkEmailErr = errors?.fields?.identifier?.message ?? null;
  const clerkPasswordErr = errors?.fields?.password?.message ?? null;

  const canSubmit =
    isValidEmail(email) && password.length >= 8 && fetchStatus !== "fetching";
  const canVerifyMFA =
    mfaCode.trim().length > 0 && fetchStatus !== "fetching";

  // ── Finalize helper ──────────────────────────────────────────────────────
  const finalize = async () => {
    const userId = signIn.createdSessionId ?? email.trim();
    posthog.identify(userId, {
      $set: { email: email.trim() },
      $set_once: { first_sign_in_date: new Date().toISOString() },
    });
    posthog.capture("user_signed_in", { email: email.trim() });

    const { error: finalizeError } = await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        router.replace(decorateUrl("/") as Href);
      },
    });
    if (finalizeError) {
      setGeneralError(finalizeError.message ?? "Sign in failed. Please try again.");
    }
  };

  // ── Password submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setTouched({ email: true, password: true });
    setGeneralError(null);

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      setGeneralError(error.message ?? "Sign in failed. Please try again.");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
      return;
    }

    if (signIn.status === "needs_second_factor") {
      // Pick the best available second factor
      const factors = signIn.supportedSecondFactors ?? [];
      const preferred =
        factors.find((f) => f.strategy === "totp") ??
        factors.find((f) => f.strategy === "phone_code") ??
        factors.find((f) => f.strategy === "email_code") ??
        factors.find((f) => f.strategy === "backup_code") ??
        factors[0];

      if (!preferred) {
        setGeneralError("No second factor available. Please contact support.");
        return;
      }

      const strategy = preferred.strategy as MFAStrategy;
      setMfaStrategy(strategy);

      // For code-delivery factors, send the code first
      if (strategy === "phone_code") {
        const { error: sendErr } = await signIn.mfa.sendPhoneCode();
        if (sendErr) {
          setGeneralError(sendErr.message ?? "Failed to send verification code.");
          return;
        }
      } else if (strategy === "email_code") {
        const { error: sendErr } = await signIn.mfa.sendEmailCode();
        if (sendErr) {
          setGeneralError(sendErr.message ?? "Failed to send verification code.");
          return;
        }
      }

      setIsMFAStep(true);
      return;
    }

    setGeneralError("Unexpected sign-in state. Please try again.");
  };

  // ── MFA submit ───────────────────────────────────────────────────────────
  const handleMFA = async () => {
    if (!canVerifyMFA || !mfaStrategy) return;

    setMfaCodeTouched(true);
    setGeneralError(null);

    const code = mfaCode.trim();
    let result: { error: { message?: string } | null };

    switch (mfaStrategy) {
      case "totp":
        result = await signIn.mfa.verifyTOTP({ code });
        break;
      case "phone_code":
        result = await signIn.mfa.verifyPhoneCode({ code });
        break;
      case "email_code":
        result = await signIn.mfa.verifyEmailCode({ code });
        break;
      case "backup_code":
        result = await signIn.mfa.verifyBackupCode({ code });
        break;
    }

    if (result.error) {
      setGeneralError(result.error.message ?? "Invalid code. Please try again.");
      return;
    }

    if (signIn.status === "complete") {
      await finalize();
    }
  };

  // ── MFA screen ───────────────────────────────────────────────────────────
  if (isMFAStep && mfaStrategy) {
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
            {/* Brand */}
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

              <Text className="auth-title">Two-step verification</Text>
              <Text className="auth-subtitle">{mfaSubtitle(mfaStrategy)}</Text>
            </View>

            {/* MFA card */}
            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    ref={mfaCodeRef}
                    className={clsx(
                      "auth-input",
                      mfaCodeTouched && !mfaCode.trim() && "auth-input-error",
                    )}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={
                      mfaStrategy === "backup_code" ? "default" : "number-pad"
                    }
                    returnKeyType="done"
                    textContentType="oneTimeCode"
                    value={mfaCode}
                    placeholder={
                      mfaStrategy === "backup_code"
                        ? "Enter backup code"
                        : "Enter 6-digit code"
                    }
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    onChangeText={setMfaCode}
                    onBlur={() => setMfaCodeTouched(true)}
                    onSubmitEditing={handleMFA}
                  />
                  {mfaCodeTouched && !mfaCode.trim() && (
                    <Text className="auth-error">Enter your verification code</Text>
                  )}
                </View>

                {generalError && (
                  <Text className="auth-error text-center">{generalError}</Text>
                )}

                <Pressable
                  className={clsx(
                    "auth-button",
                    !canVerifyMFA && "auth-button-disabled",
                  )}
                  onPress={handleMFA}
                  disabled={!canVerifyMFA}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching" ? "Verifying…" : "Verify"}
                  </Text>
                </Pressable>

                <Pressable
                  className="auth-link-row"
                  onPress={() => {
                    setIsMFAStep(false);
                    setMfaCode("");
                    setMfaCodeTouched(false);
                    setGeneralError(null);
                  }}
                  hitSlop={8}
                >
                  <Text className="auth-link">← Back to sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Password screen ──────────────────────────────────────────────────────
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

              {/* General error */}
              {generalError && (
                <Text className="auth-error text-center">{generalError}</Text>
              )}

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
