import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: optionalUrl,
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AI_PROVIDER: z.enum(["mock", "gemini", "openrouter"]).default("mock"),
  AI_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  INFINITEPAY_WEBHOOK_SECRET: z.string().optional(),
  INFINITEPAY_CHECKOUT_URL: optionalUrl,
  INFINITEPAY_CHECKOUT_MONTHLY_URL: optionalUrl,
  INFINITEPAY_CHECKOUT_ANNUAL_URL: optionalUrl,
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_MODEL: process.env.AI_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  INFINITEPAY_WEBHOOK_SECRET: process.env.INFINITEPAY_WEBHOOK_SECRET,
  INFINITEPAY_CHECKOUT_URL: process.env.INFINITEPAY_CHECKOUT_URL,
  INFINITEPAY_CHECKOUT_MONTHLY_URL: process.env.INFINITEPAY_CHECKOUT_MONTHLY_URL,
  INFINITEPAY_CHECKOUT_ANNUAL_URL: process.env.INFINITEPAY_CHECKOUT_ANNUAL_URL,
});
