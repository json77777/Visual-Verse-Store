"use client";

import Image from "next/image";
import { useId } from "react";

export function AdminPageShell({
  breadcrumb,
  title,
  actions,
  children,
}: {
  breadcrumb: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-neutral-900 text-white">
      <header className="mx-auto w-full max-w-5xl px-10 pt-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-white/45">
              {breadcrumb}
            </p>
            <h1 className="mt-3 text-[44px] leading-[1.05] tracking-[-0.02em]">
              {title}
            </h1>
          </div>

          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>

        <div className="mt-7 h-px w-full bg-white/15" />
      </header>

      <main className="mx-auto w-full max-w-5xl px-10 pb-16">
        {children}
      </main>
    </div>
  );
}

export function AdminButton({
  variant = "outline",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "solid";
}) {
  const className =
    variant === "solid"
      ? "h-9 rounded-md bg-white text-neutral-950 px-4 text-[12px] font-medium tracking-[0.14em] hover:bg-white/90 disabled:opacity-60 transition-colors"
      : "h-9 rounded-md border border-white/25 bg-neutral-900 px-4 text-[12px] font-medium tracking-[0.14em] text-white hover:bg-white/10 disabled:opacity-60 transition-colors";

  return (
    <button
      {...props}
      className={`vv-soft-press ${className} ${props.className ?? ""}`.trim()}
    >
      {children}
    </button>
  );
}

export function AdminSectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-[18px] tracking-[-0.01em] text-white">{title}</h2>
  );
}

export function AdminLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-[0.18em] text-white/45">
      {children}
    </p>
  );
}

export function AdminTextInput({
  label,
  value,
  onChange,
  placeholder,
  leftAdornment,
  inputMode,
  type,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  leftAdornment?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  autoComplete?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block">
        <AdminLabel>{label}</AdminLabel>
      </label>
      <div className="relative">
        {leftAdornment ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/55">
            {leftAdornment}
          </div>
        ) : null}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          type={type}
          autoComplete={autoComplete}
          className={`h-11 w-full rounded-md bg-white/3 px-3 text-[13px] text-white outline-none ring-1 ring-white/10 focus:ring-white/25 ${
            leftAdornment ? "pl-8" : ""
          }`}
        />
      </div>
    </div>
  );
}

export function AdminTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block">
        <AdminLabel>{label}</AdminLabel>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="min-h-25 w-full resize-y rounded-md bg-white/3 px-3 py-3 text-[13px] text-white outline-none ring-1 ring-white/10 focus:ring-white/25"
      />
    </div>
  );
}

export function AdminToggle({
  checked,
  onCheckedChange,
  label,
  helper,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  helper?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <AdminLabel>{label}</AdminLabel>
        {helper ? <p className="mt-1 text-[11px] text-white/45">{helper}</p> : null}
      </div>

      <button
        type="button"
        aria-pressed={checked}
        className={`relative h-5 w-9 rounded-full ring-1 transition-colors ${
          checked
            ? "bg-green-500/25 ring-green-400/30"
            : "bg-white/10 ring-white/25 hover:bg-white/15"
        }`}
        onClick={() => onCheckedChange(!checked)}
      >
        <span
          className={`absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white/90 shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function AdminDropzone({
  label,
  helper,
  accept,
  file,
  onPick,
  iconSrc,
  ctaText,
  recommendedText,
}: {
  label: string;
  helper?: string;
  accept?: string;
  file: File | null;
  onPick: (f: File | null) => void;
  iconSrc: string;
  ctaText: string;
  recommendedText?: string;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <AdminLabel>{label}</AdminLabel>

      <label
        htmlFor={id}
        className="group relative flex h-42.5 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-white/15 bg-neutral-900 text-center hover:bg-white/1"
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        <div className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-neutral-900">
          <Image src={iconSrc} alt="" width={18} height={18} />
        </div>

        <p className="text-[12px] text-white/70">
          {file ? (
            <>
              <span className="font-medium text-white">{file.name}</span>
              <span className="text-white/55"> · click to replace</span>
            </>
          ) : (
            <>
              <span className="font-medium text-white">{ctaText}</span>
              <span className="text-white/55"> or browse</span>
            </>
          )}
        </p>

        {recommendedText ? (
          <p className="text-[11px] text-white/40">{recommendedText}</p>
        ) : null}

        {helper ? <p className="text-[11px] text-white/40">{helper}</p> : null}

        {file ? (
          <button
            type="button"
            className="absolute right-3 top-3 text-[11px] text-white/55 hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              onPick(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </label>
    </div>
  );
}

export function AdminCheckbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const id = useId();

  return (
    <label htmlFor={id} className="flex items-start gap-3 text-[12px]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-white/25 bg-neutral-900 accent-green-500"
      />
      <span className="text-white/70">{label}</span>
    </label>
  );
}
