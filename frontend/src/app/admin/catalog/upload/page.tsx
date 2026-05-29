"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLegacyCatalogUploadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/upload");
  }, [router]);

  return null;
}
