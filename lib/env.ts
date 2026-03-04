import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  PARALLEL_API_KEY: z.string().min(10),
  OPENAI_API_KEY: z.string().min(10),
  PARALLEL_FINDALL_BETA: z.string().default("findall-2025-09-15"),
  OUTREACH_FROM_EMAIL: z.string().email(),
  RESEND_API_KEY: z.string().min(10).optional(),
  STRIPE_SECRET_KEY: z.string().min(10).optional(),
  WHATSAPP_PROVIDER: z.enum(["none", "twilio"]).default("none"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  AUTOMATION_SHARED_SECRET: z.string().min(16)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
