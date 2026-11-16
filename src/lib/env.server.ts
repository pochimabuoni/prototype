import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export const serverEnv = {
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: () => required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET"),
  stripePriceId: () => required("STRIPE_PRICE_ID"),
  resendApiKey: () => process.env.RESEND_API_KEY || null,
  emailFrom: () => process.env.EMAIL_FROM || "Pochi Ma Buoni <membership@example.com>",
  adminNotificationEmail: () => process.env.ADMIN_NOTIFICATION_EMAIL || null,
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
