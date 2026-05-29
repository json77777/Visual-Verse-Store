"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export default function AdminSettingsPage() {
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchNote() {
      try {
        const res = await apiFetch<ApiResponse<{value: string, updatedAt: string} | null>>("/api/v1/settings/owner_note");
        if (mounted) {
          setNote(res.data?.value || "");
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load setting");
          setIsLoading(false);
        }
      }
    }
    fetchNote();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch("/api/v1/settings/owner_note", {
        method: "PUT",
        body: { value: note },
      });
      setSuccessMsg("Owner's Note updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update setting");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell title="Owner's Note">
      <div className="max-w-2xl rounded-xl border border-white/10 bg-neutral-900/50 p-6 backdrop-blur-md">
        <p className="mb-6 text-sm text-white/50">
          This message will be visible to all users when they click the top right corner of the screen.
        </p>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        {successMsg && <p className="mb-4 text-sm text-green-400">{successMsg}</p>}

        <div className="space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isLoading}
            className="w-full min-h-[150px] rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Write a message to your visitors..."
          />
          
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
