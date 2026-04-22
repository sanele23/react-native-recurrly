<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Recurly Expo app. The following changes were made:

- **`app.config.js`** — Created to expose `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from `.env` via `expo-constants` extras (replaces static `app.json` at build time).
- **`lib/posthog.ts`** — New PostHog client singleton, configured via `Constants.expoConfig.extra`, with lifecycle capture, batching, and feature flag support.
- **`app/_layout.tsx`** — Added `PostHogProvider` wrapping the app, manual screen tracking with `posthog.screen()` on every route change using `usePathname`.
- **`app/(auth)/sign-in.tsx`** — Captures `user_signed_in` and calls `posthog.identify()` with email on successful login.
- **`app/(auth)/sign-up.tsx`** — Captures `user_signed_up` and calls `posthog.identify()` with email after email verification completes.
- **`app/(tabs)/settings.tsx`** — Captures `user_signed_out` and calls `posthog.reset()` before signing the user out.
- **`app/(tabs)/index.tsx`** — Captures `subscription_card_expanded` with subscription name and billing info when a card is expanded.
- **`app/subscriptions/[id].tsx`** — Captures `subscription_details_viewed` with the subscription ID on mount.

## Events

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signs in with email and password via Clerk | `app/(auth)/sign-in.tsx` |
| `user_signed_up` | User successfully creates a new account and verifies their email via Clerk | `app/(auth)/sign-up.tsx` |
| `user_signed_out` | User signs out from the Settings screen | `app/(tabs)/settings.tsx` |
| `subscription_card_expanded` | User taps a subscription card to expand its details on the home screen | `app/(tabs)/index.tsx` |
| `subscription_details_viewed` | User navigates to the subscription detail screen (top of conversion funnel) | `app/subscriptions/[id].tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/387751/dashboard/1483744)
- **Insight**: [Sign-ups over time](https://us.posthog.com/project/387751/insights/r3sspWPf)
- **Insight**: [Sign-ins over time](https://us.posthog.com/project/387751/insights/n4nCQl0J)
- **Insight**: [Sign-up to sign-in conversion funnel](https://us.posthog.com/project/387751/insights/YAoGZ6mX)
- **Insight**: [Subscription engagement funnel](https://us.posthog.com/project/387751/insights/q9smiU2y)
- **Insight**: [Sign-outs (churn signal)](https://us.posthog.com/project/387751/insights/mUf77j89)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
