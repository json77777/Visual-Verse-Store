import React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import localFont from "next/font/local";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { InitialLoader } from "@/components/InitialLoader";
import { GlobalBackground } from "@/components/GlobalBackground";
import { CornerElements } from "@/components/CornerElements";
import { SmoothScroll } from "@/components/SmoothScroll";

const helveticaNeue = localFont({
  src: "./fonts/HelveticaNeueRoman.otf",
  variable: "--font-helvetica-neue",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Visual Verse Store",
  description: "Visual Verse Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${helveticaNeue.variable} ${syne.variable} ${dmSans.variable} antialiased dark text-[17px] overflow-y-scroll`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#080808] text-neutral-50 font-dm-sans selection:bg-white/20 selection:text-white relative"
      >
        <React.Suspense fallback={null}>
          <SmoothScroll>
            <InitialLoader />

            <GlobalBackground />
            <CornerElements />


            <div className="relative z-10 flex min-h-screen flex-col" suppressHydrationWarning>
            <SiteHeader />
            <div className="vv-page-in flex flex-col flex-1 pt-28" suppressHydrationWarning>{children}</div>
            <SiteFooter />
          </div>
            
            <Toaster 
              position="top-right"
              offset={80}
              gap={8}
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: 'var(--font-dm-sans)',
                  minHeight: 'unset',
                  width: 'max-content',
                  maxWidth: '400px',
                  gap: '8px',
                },
                className: 'vv-toast',
              }}
              theme="dark"
            />
          </SmoothScroll>
        </React.Suspense>
      </body>
    </html>
  );
}
