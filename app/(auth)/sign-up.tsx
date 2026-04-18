import "@/global.css";
import { useSignUp } from "@clerk/expo";
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type Strength = { label: "Weak" | "Fair" | "Strong"; bars: 1 | 2 | 3 };

const passwordStrength = (pwd: string): Strength | null => {
  if (pwd.length === 0) return null;
  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(
    Boolean,
  ).length;

  if (pwd.length >= 12 && variety >= 3) return { label: "Strong", bars: 3 };
  if (pwd.length >= 8 && variety >= 2) return { label: "Fair", bars: 2 };
  return { label: "Weak", bars: 1 };
};

const STRENGTH_COLOR: Record<Strength["label"], string> = {
  Weak: "#dc2626",
  Fair: "#ea7a53",
  Strong: "#16a34a",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // ── Verify step state ───────────────────────────────────────────────────
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

  // ── Derived validation ──────────────────────────────────────────────────
  const emailErr =
    touched.email && !isValidEmail(email)
      ? "Enter a valid email address"
      : null;
  const passwordErr =
    touched.password && password.length < 8
      ? "Password must be at least 8 characters"
      : null;
  const codeErr =
    codeTouched && code.trim().length === 0
      ? "Enter the verification code"
      : null;

  const clerkEmailErr = errors?.fields?.emailAddress?.message ?? null;
  const clerkPasswordErr = errors?.fields?.password?.message ?? null;
  const clerkCodeErr = errors?.fields?.code?.message ?? null;

  const strength = passwordStrength(password);
  const canSubmitForm =
    isValidEmail(email) && password.length >= 8 && fetchStatus !== "fetching";
  const canVerify = code.trim().length > 0 && fetchStatus !== "fetching";

  const isVerifyStep =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSubmitForm = async () => {
    setTouched({ email: true, password: true });
    if (!canSubmitForm) return;

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) return;

    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    setCodeTouched(true);
    if (!canVerify) return;

    await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.replace(url as Href);
          }
        },
      });
    }
  };

  // ── Verify email step ────────────────────────────────────────────────────
  if (isVerifyStep) {
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

              <Text className="auth-title">Check your inbox</Text>
              <Text className="auth-subtitle">
                We sent a 6-digit code to{"\n"}
                <Text className="font-sans-bold text-primary">{email}</Text>
              </Text>
            </View>

            {/* Verify card */}
            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    ref={codeRef}
                    value={code}
                    placeholder="------"
                    placeholderTextColor="rgba(8,17,38,0.25)"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
                    onBlur={() => setCodeTouched(true)}
                    onSubmitEditing={handleVerify}
                    autoFocus
                  />
                  {(codeErr || clerkCodeErr) && (
                    <Text className="auth-error">
                      {codeErr ?? clerkCodeErr}
                    </Text>
                  )}
                  <Text className="auth-helper text-center">
                    Check your spam folder if you do not see it.
                  </Text>
                </View>

                {/* Verify button */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    !canVerify && "auth-button-disabled",
                  )}
                  onPress={handleVerify}
                  disabled={!canVerify}
                >
                  <Text className="auth-button-text">
                    {fetchStatus === "fetching"
                      ? "Verifying…"
                      : "Verify account"}
                  </Text>
                </Pressable>

                {/* Resend */}
                <Pressable
                  className="auth-secondary-button"
                  onPress={() => signUp.verifications.sendEmailCode()}
                  disabled={fetchStatus === "fetching"}
                >
                  <Text className="auth-secondary-button-text">
                    Resend code
                  </Text>
                </Pressable>

                {/* Back to form */}
                <View className="auth-link-row">
                  <Text className="auth-link-copy">Wrong email?</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={async () => {
                      setCode("");
                      setCodeTouched(false);
                      if (signUp) await signUp.reset();
                    }}
                  >
                    <Text className="auth-link"> Go back</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
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
          {/* ── Brand ──────────────────────────────────────────────── */}
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

            <Text className="auth-title">Create your account</Text>
            <Text className="auth-subtitle">
              Start tracking every subscription{"\n"}in one place — for free
            </Text>
          </View>

          {/* ── Form card ──────────────────────────────────────────── */}
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

              {/* Password + strength */}
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
                    placeholder="Create a password"
                    placeholderTextColor="rgba(8,17,38,0.35)"
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    textContentType="newPassword"
                    onChangeText={setPassword}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    onSubmitEditing={handleSubmitForm}
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

                {/* Password strength meter */}
                {strength && !passwordErr && !clerkPasswordErr && (
                  <View className="mt-2 gap-1.5">
                    <View className="flex-row gap-1.5">
                      {([1, 2, 3] as const).map((bar) => (
                        <View
                          key={bar}
                          className="h-1 flex-1 rounded-full"
                          style={{
                            backgroundColor:
                              bar <= strength.bars
                                ? STRENGTH_COLOR[strength.label]
                                : "rgba(8,17,38,0.1)",
                          }}
                        />
                      ))}
                    </View>
                    <Text
                      className="text-xs font-sans-semibold"
                      style={{ color: STRENGTH_COLOR[strength.label] }}
                    >
                      {strength.label} password
                    </Text>
                  </View>
                )}

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
                  !canSubmitForm && "auth-button-disabled",
                )}
                onPress={handleSubmitForm}
                disabled={!canSubmitForm}
              >
                <Text className="auth-button-text">
                  {fetchStatus === "fetching"
                    ? "Creating account…"
                    : "Create account"}
                </Text>
              </Pressable>

              {/* Divider */}
              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">or</Text>
                <View className="auth-divider-line" />
              </View>

              {/* Link to sign-in */}
              <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="auth-link"> Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>

          {/* Required for Clerk's bot-signup protection */}
          <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
