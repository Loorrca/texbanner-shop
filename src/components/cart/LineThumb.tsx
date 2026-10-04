"use client";

import Image from "next/image";
import { ProductPreview } from "@/components/ProductPreview";
import type { CartLine } from "./CartProvider";

export function LineThumb({ line, className = "h-20 w-24" }: { line: CartLine; className?: string }) {
  // The customer's own artwork, when they uploaded one: it goes into the generated mock-up where
  // there is one, and otherwise replaces the catalogue photo — the cart should show what they
  // configured, not the default design.
  const art = line.uploadImage ?? null;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 ${className}`}>
      {line.preview ? (
        <ProductPreview kind={line.preview} selections={line.selections} logoUrl={art} className="h-full w-full" />
      ) : art ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" className="absolute inset-0 h-full w-full bg-white object-contain" />
      ) : line.image ? (
        <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
      ) : null}
    </div>
  );
}
