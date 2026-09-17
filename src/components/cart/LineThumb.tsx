"use client";

import Image from "next/image";
import { ProductPreview } from "@/components/ProductPreview";
import type { CartLine } from "./CartProvider";

export function LineThumb({ line, className = "h-20 w-24" }: { line: CartLine; className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200 ${className}`}>
      {line.preview ? (
        <ProductPreview kind={line.preview} selections={line.selections} className="h-full w-full" />
      ) : line.image ? (
        <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
      ) : null}
    </div>
  );
}
