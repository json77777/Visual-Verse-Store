import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Visual Verse",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh)]">
      {children}
    </div>
  );
}
