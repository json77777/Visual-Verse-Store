"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/promotion", label: "Promotion" },
  { href: "/admin/upload", label: "upload" },
  { href: "/admin/edit", label: "Edit Products" },
  { href: "/admin/settings", label: "Owner's Note" },
] as const;

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin/edit" && pathname.startsWith("/admin/edit/")) return true;
  return false;
}

export function AdminShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-[1024px] px-6 pb-16 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-col md:flex-row min-h-[70vh] gap-8 md:gap-0">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-[220px] shrink-0 md:border-r border-white/10 md:pr-6 md:mr-8">
          <div className="md:sticky md:top-32 relative z-20">
            <nav className="flex flex-col space-y-1 relative">
              {/* Frosted container behind nav items */}
              <div className="absolute inset-0 -mx-4 -my-4 rounded-2xl bg-neutral-950/35 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.35),0_0_18px_rgba(255,255,255,0.03)] ring-1 ring-white/5 pointer-events-none" />
              
              <div className="relative z-10 space-y-2">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`vv-soft-press block px-4 py-2.5 rounded-lg text-sm transition-all duration-300 tracking-wide ${
                        active 
                          ? "text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10" 
                          : "text-white/50 hover:text-white hover:bg-white/5 hover:border-white/5 border border-transparent"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 w-full min-w-0 pb-10">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-syne font-extrabold text-2xl tracking-[-0.03em] text-white">
              {title}
            </h1>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </div>

          <div className="mt-6 relative z-10">{children}</div>
        </section>
      </div>
    </div>
  );
}
