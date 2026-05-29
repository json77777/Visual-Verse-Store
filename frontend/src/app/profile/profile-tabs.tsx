"use client";

import Link from "next/link";

type Active = "account" | "downloads";

export function ProfileTabs({ active }: { active: Active }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-12 text-xs font-medium tracking-wide text-white/70">
      <Link href="/profile" className="relative pb-2">
        <span className={active === "account" ? "text-white" : undefined}>
          Account
        </span>
        {active === "account" ? (
          <span className="absolute inset-x-0 -bottom-px h-px bg-neutral-900" />
        ) : null}
      </Link>

      <Link href="/downloads" className="relative pb-2">
        <span className={active === "downloads" ? "text-white" : undefined}>
          Downloads
        </span>
        {active === "downloads" ? (
          <span className="absolute inset-x-0 -bottom-px h-px bg-neutral-900" />
        ) : null}
      </Link>
    </div>
  );
}
