type PageLoadingProps = {
  title?: string;
  subtitle?: string;
};

export function PageLoading({
  title = "Carregando",
  subtitle = "Preparando sua experiência.",
}: PageLoadingProps) {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto grid max-w-7xl gap-5">
        <div className="rounded-lg border border-white/10 bg-white/8 p-5 sm:p-7">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-cyan-300/20" />
          <div className="mt-5 h-7 w-52 animate-pulse rounded bg-white/10" />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            {title}. {subtitle}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-lg border border-white/10 bg-slate-900"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg border border-white/10 bg-slate-900" />
      </section>
    </main>
  );
}
