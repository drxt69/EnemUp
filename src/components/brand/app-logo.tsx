import { BookOpenCheck } from "lucide-react";

type AppLogoProps = {
  context?: string;
  size?: "sm" | "md";
};

export function AppLogo({ context, size = "md" }: AppLogoProps) {
  const imageSize = size === "sm" ? "h-10 w-10" : "h-11 w-11 sm:h-12 sm:w-12";
  const iconSize = size === "sm" ? "h-5 w-5" : "h-5 w-5 sm:h-6 sm:w-6";
  const textSize = size === "sm" ? "text-base" : "text-base sm:text-lg";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-md bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.32)] ${imageSize}`}
      >
        <BookOpenCheck aria-hidden className={iconSize} strokeWidth={2.5} />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block whitespace-nowrap font-semibold uppercase tracking-[0.14em] text-cyan-100 sm:tracking-[0.18em] ${textSize}`}>
          ENEM UP
        </span>
        {context ? (
          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            {context}
          </span>
        ) : null}
      </span>
    </div>
  );
}
