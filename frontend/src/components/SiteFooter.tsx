import Image from "next/image";
import Link from "next/link";

type SocialLink = {
  label: string;
  href?: string;
  iconSrc: string;
};

const SOCIAL_LINKS: SocialLink[] = [
  { label: "YouTube", href: "https://www.youtube.com/@vverse-ae", iconSrc: "/icons/youtube.png" },
  { label: "Discord", href: "https://discord.gg/4z55Ut6s", iconSrc: "/icons/discord.png" },
  { label: "Fiverr", href: "https://fiverr.com/s/6Yoo0Gr", iconSrc: "/icons/fiverr.png" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#080808]">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
        <div className="py-12">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/40 backdrop-blur-xl ring-1 ring-white/5 shadow-[0_0_24px_rgba(0,0,0,0.35)]">
            <div className="grid grid-cols-1 gap-10 p-8 md:grid-cols-3 md:items-start md:p-10">
              <div>
                <p className="font-syne font-extrabold text-2xl tracking-[-0.04em] text-white/95 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                  Visual Verse
                </p>
                <p className="mt-2 max-w-[48ch] font-dm-sans font-normal text-sm leading-relaxed text-white/50">
                  Curated digital drops for designers, editors, and storytellers.
                </p>
              </div>

              <div className="md:justify-self-center">
                <p className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Quick Links
                </p>
                <div className="mt-4 grid gap-2 text-sm font-dm-sans font-normal">
                  <Link
                    href="/products"
                    className="group vv-soft-press inline-flex w-fit items-center gap-2 text-white/70 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                  >
                    <span>Products</span>
                    <span className="text-white/40 group-hover:text-white/70 transition-colors">→</span>
                  </Link>
                  <Link
                    href="/about"
                    className="group vv-soft-press inline-flex w-fit items-center gap-2 text-white/70 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                  >
                    <span>About</span>
                    <span className="text-white/40 group-hover:text-white/70 transition-colors">→</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="group vv-soft-press inline-flex w-fit items-center gap-2 text-white/70 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                  >
                    <span>Contact</span>
                    <span className="text-white/40 group-hover:text-white/70 transition-colors">→</span>
                  </Link>
                </div>
              </div>

              <div className="md:justify-self-end">
                <p className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Social
                </p>
                <div className="mt-4 flex items-center gap-3">
                  {SOCIAL_LINKS.map((s) =>
                    s.href ? (
                      <a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group vv-soft-press vv-soft-hover grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/2 hover:bg-white/6 hover:border-white/20 ring-1 ring-white/5 transition-colors"
                      >
                        <Image
                          src={s.iconSrc}
                          alt=""
                          width={20}
                          height={20}
                          className="invert opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </a>
                    ) : (
                      <span
                        key={s.label}
                        aria-label={s.label}
                        title="Coming soon"
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/2 ring-1 ring-white/5 opacity-70"
                      >
                        <Image
                          src={s.iconSrc}
                          alt=""
                          width={20}
                          height={20}
                          className="invert opacity-90"
                        />
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="flex flex-col gap-2 px-8 py-6 text-[11px] text-white/45 md:flex-row md:items-center md:justify-between md:px-10">
              <p className="font-dm-sans font-light text-[11px] text-white/45">© {new Date().getFullYear()} Visual Verse. All rights reserved.</p>
              <p className="font-dm-sans font-light text-[11px] text-white/45">Crafted for creators.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
