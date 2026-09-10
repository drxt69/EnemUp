import { env } from "@/lib/env";

export function getInfinitePayCheckoutUrl(planKey: string) {
  if (planKey === "monthly") {
    return env.INFINITEPAY_CHECKOUT_MONTHLY_URL ?? env.INFINITEPAY_CHECKOUT_URL;
  }

  if (planKey === "annual") {
    return env.INFINITEPAY_CHECKOUT_ANNUAL_URL ?? env.INFINITEPAY_CHECKOUT_URL;
  }

  return env.INFINITEPAY_CHECKOUT_URL;
}
