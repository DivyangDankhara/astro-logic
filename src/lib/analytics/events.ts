export const ANALYTICS_EVENTS = {
  authSignupCompleted: "auth_signup_completed",
  calculateAttempted: "calculate_attempted",
  calculateSucceeded: "calculate_succeeded",
  calculateBlockedQuota: "calculate_blocked_quota",
  pricingViewed: "pricing_viewed",
  checkoutStarted: "checkout_started",
  checkoutCompleted: "checkout_completed",
  subscriptionStatusChanged: "subscription_status_changed",
  chartSaved: "chart_saved",
  chartDeleted: "chart_deleted",
  interpretationRequested: "interpretation_requested",
  interpretationCompleted: "interpretation_completed",
  interpretationFailed: "interpretation_failed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
