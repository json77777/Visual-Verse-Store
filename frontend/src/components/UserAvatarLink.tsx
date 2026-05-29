"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiFetchError, apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";
import { USER_UPDATED_EVENT } from "@/lib/userEvents";

type CurrentUser = {
  _id: string;
  avatar?: string;
};

export function UserAvatarLink() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch<ApiResponse<CurrentUser>>(
          "/api/v1/users/current-user",
          { cache: "no-store", redirectOn401: false },
        );

        if (!mounted) return;
        setAvatarUrl(res.data?.avatar ?? null);
      } catch (e) {
        if (!mounted) return;

        // Not logged in (or session expired) → show default icon.
        if (e instanceof ApiFetchError && e.status === 401) {
          setAvatarUrl(null);
          return;
        }

        setAvatarUrl(null);
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

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="vv-soft-press grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 transition-colors"
    >
      {avatarUrl ? (
        <span className="relative h-6 w-6 overflow-hidden rounded-full bg-white/10">
          <Image
            src={avatarUrl}
            alt=""
            fill
            sizes="24px"
            priority
            className="object-cover transition-transform duration-300 hover:scale-110"
          />
        </span>
      ) : (
        <Image src="/icons/user.png" alt="" width={24} height={24} className="invert opacity-90 transition-transform duration-300 hover:scale-110" />
      )}
    </Link>
  );
}
