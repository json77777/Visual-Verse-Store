export default function ContactPage() {
  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-5xl px-8 pt-14 pb-16">
        <div className="mx-auto w-full max-w-230">
        <h1 className="text-lg tracking-wide">Contact</h1>
        <div className="mt-6 h-px w-full bg-white/10" />

        <p className="mt-8 text-sm leading-6 text-white/70">
          Need help with an order, downloads, installation, or want to pitch a
          collab? The fastest way to reach us is on Discord.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-950/40 p-6 backdrop-blur-xl ring-1 ring-white/5 shadow-[0_0_24px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Support
          </p>
          <h2 className="mt-3 text-xl font-medium tracking-wide text-white/90">
            Join our Discord
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Drop your order ID (if you have one) + a quick description of what
            you&apos;re trying to do. We&apos;ll guide you to the fix.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="https://discord.gg/4z55Ut6s"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-white px-5 text-[12px] font-medium tracking-[0.14em] text-neutral-950 hover:bg-white/90 transition-colors sm:w-auto"
            >
              Join Discord
            </a>
            <p className="text-xs text-white/50">
              Typical response: within 24 hours.
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
