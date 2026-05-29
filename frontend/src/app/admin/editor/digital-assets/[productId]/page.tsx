"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLegacyDigitalAssetsEditRedirect({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const router = useRouter();
  const { productId } = use(params);

  useEffect(() => {
    router.replace(`/admin/edit/${productId}`);
  }, [router, productId]);

  return null;
}
