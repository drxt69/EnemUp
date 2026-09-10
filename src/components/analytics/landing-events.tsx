"use client";

import { useEffect } from "react";

type AnalyticsPayload = {
  event: string;
  href?: string;
  label?: string | null;
};

declare global {
  interface Window {
    dataLayer?: AnalyticsPayload[];
  }
}

function emitLandingEvent(payload: AnalyticsPayload) {
  window.dispatchEvent(new CustomEvent("enemup:analytics", { detail: payload }));
  window.dataLayer?.push(payload);
}

export function LandingEvents() {
  useEffect(() => {
    emitLandingEvent({ event: "landing_view" });

    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const element = target.closest<HTMLElement>("[data-analytics-event]");

      if (!element) {
        return;
      }

      emitLandingEvent({
        event: element.dataset.analyticsEvent ?? "landing_click",
        href: element instanceof HTMLAnchorElement ? element.href : undefined,
        label: element.textContent?.trim() ?? null,
      });
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
