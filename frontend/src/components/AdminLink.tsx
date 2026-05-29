"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { USER_UPDATED_EVENT } from "@/lib/userEvents";

type CurrentUser = {
  _id: string;
  role?: "user" | "admin";
};

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store", redirectOn401: false },
        );

        if (!mounted) return;
        setIsAdmin(res.data?.role === "admin");
      } catch (e) {
        if (!mounted) return;

        if (e instanceof ApiFetchError && e.status === 401) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(false);
      }
    }

    const onUserUpdated = () => void load();

    void load();
    window.addEventListener(USER_UPDATED_EVENT, onUserUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(USER_UPDATED_EVENT, onUserUpdated);
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/catalog/upload"
      aria-label="Admin"
      className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/5"
      title="Admin"
    >
      <Image
        src="/assets/icons/admin_panel_settings.png"
        alt=""
        width={22}
        height={22}
      />
    </Link>
  );
}
