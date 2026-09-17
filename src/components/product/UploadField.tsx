"use client";

import { useRef, useState } from "react";

export type UploadedFile = { id: string; name: string; localUrl: string | null };

export function UploadField({ id, value, onChange, t }: { id: string; value: UploadedFile | null; onChange: (f: UploadedFile | null) => void; t: { hint: string; uploading: string; uploaded: string; remove: string; error: string } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) return setError(t.hint);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "upload failed");
      const previewable = /^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type);
      onChange({ id: data.id, name: file.name, localUrl: previewable ? URL.createObjectURL(file) : null });
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
          {value.localUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.localUrl} alt="" className="h-10 w-10 rounded bg-white object-contain ring-1 ring-stone-200" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded bg-white text-xs font-bold ring-1 ring-stone-200">PDF</span>
          )}
          <span className="flex-1 truncate">
            <span className="block text-xs font-semibold text-emerald-700">{t.uploaded}</span>
            {value.name}
          </span>
          <button type="button" onClick={() => onChange(null)} className="font-semibold text-stone-500 hover:text-brand">{t.remove}</button>
        </div>
      ) : (
        <label htmlFor={id} className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-white px-4 py-5 text-center text-sm transition hover:border-brand ${busy ? "opacity-60" : ""}`}>
          <span className="font-bold">{busy ? t.uploading : "⬆"}</span>
          <span className="mt-1 text-xs text-stone-500">{t.hint}</span>
          <input ref={input} id={id} type="file" accept=".png,.jpg,.jpeg,.webp,.svg,.pdf" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
      {error && <p className="mt-1 text-xs font-semibold text-brand">{error}</p>}
    </div>
  );
}
