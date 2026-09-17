"use client";

import { useId } from "react";
import { flagSrc } from "@/lib/countries";
import type { Selections } from "@/lib/options";

/**
 * Live, generated product visuals. Every flag-based product is drawn from the
 * selected country's SVG flag, the customer's uploaded logo and their text, so
 * the shop shows all 240+ countries without needing a photo of each one.
 */
export type PreviewKind =
  | "pavillon" | "pavillon-logo"
  | "guirlande" | "guirlande-mixte" | "guirlande-logo" | "guirlande-triangles"
  | "banderole-texte" | "banderole-logo" | "banderole-drapeaux"
  | "oriflamme" | "oriflamme-logo"
  | "fanion-salon" | "fanion-table" | "fanion-club"
  | "beachflag";

const COLORS: Record<string, string> = {
  red: "#c8102e", white: "#ffffff", blue: "#1d4ed8", black: "#111111", green: "#15803d", gold: "#c9a227",
};
const flag = (code?: string) => flagSrc(code);

type Props = { kind: string; selections: Selections; logoUrl?: string | null; className?: string; title?: string };

export function ProductPreview({ kind, selections: s, logoUrl, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const Scene = SCENES[kind as PreviewKind] ?? SCENES.pavillon;
  return (
    <svg viewBox="0 0 600 450" className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5efe6" />
          <stop offset="1" stopColor="#e9dfcf" />
        </linearGradient>
        {/* Fabric folds: alternating light/dark bands */}
        <linearGradient id={`${uid}-folds`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.38" stopColor="#000" stopOpacity="0.14" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`${uid}-vfolds`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0.08" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6d1c" />
          <stop offset="0.5" stopColor="#f3d77a" />
          <stop offset="1" stopColor="#8a6d1c" />
        </linearGradient>
        <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="0.5" stopColor="#f3f4f6" />
          <stop offset="1" stopColor="#6b7280" />
        </linearGradient>
        <filter id={`${uid}-shadow`} x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.18" />
        </filter>
      </defs>
      <Scene uid={uid} s={s} logoUrl={logoUrl ?? null} />
    </svg>
  );
}

type SceneProps = { uid: string; s: Selections; logoUrl: string | null };

/** Logo artwork or a neutral placeholder when nothing was uploaded yet. */
function Logo({ x, y, w, h, logoUrl, dark = false }: { x: number; y: number; w: number; h: number; logoUrl: string | null; dark?: boolean }) {
  if (logoUrl) return <image href={logoUrl} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" />;
  const r = Math.min(w, h) / 2;
  return (
    <g>
      <circle cx={x + w / 2} cy={y + h / 2} r={r * 0.92} fill="none" stroke={dark ? "#fff" : "#111"} strokeOpacity="0.35" strokeWidth={Math.max(1.5, r * 0.06)} strokeDasharray={`${r * 0.25} ${r * 0.15}`} />
      <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.42} fontWeight="700" fill={dark ? "#fff" : "#111"} fillOpacity="0.5" fontFamily="Cairo Variable, sans-serif">
        LOGO
      </text>
    </g>
  );
}

/** Wavy flag on a pole, used for pavillons. */
function WavingFlag({ uid, x, y, w, h, children, id }: { uid: string; x: number; y: number; w: number; h: number; children: React.ReactNode; id: string }) {
  const a = h * 0.06;
  const d = `M${x},${y} C${x + w * 0.3},${y - a} ${x + w * 0.6},${y + a} ${x + w},${y - a * 0.4} L${x + w},${y + h - a * 0.4} C${x + w * 0.6},${y + h + a} ${x + w * 0.3},${y + h - a} ${x},${y + h} Z`;
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <clipPath id={`${uid}-${id}`}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${uid}-${id})`}>
        {children}
        <rect x={x} y={y - a} width={w} height={h + 2 * a} fill={`url(#${uid}-folds)`} />
      </g>
    </g>
  );
}

const Pole = ({ uid, x, y1, y2, w = 8 }: { uid: string; x: number; y1: number; y2: number; w?: number }) => (
  <g>
    <rect x={x - w / 2} y={y1} width={w} height={y2 - y1} rx={w / 2} fill={`url(#${uid}-steel)`} />
    <circle cx={x} cy={y1} r={w * 0.9} fill={`url(#${uid}-steel)`} />
  </g>
);

function Pavillon({ uid, s }: SceneProps) {
  const [x, y, w, h] = [150, 70, 360, 240];
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-sky)`} />
      <Pole uid={uid} x={140} y1={50} y2={450} />
      <WavingFlag uid={uid} id="pav" x={x} y={y} w={w} h={h}>
        <image href={flag(s.country)} x={x} y={y - 20} width={w} height={h + 40} preserveAspectRatio="none" />
      </WavingFlag>
    </g>
  );
}

function PavillonLogo({ uid, s, logoUrl }: SceneProps) {
  const [x, y, w, h] = [150, 70, 360, 240];
  const bg = COLORS[s.background ?? "white"] ?? "#fff";
  const dark = bg !== "#ffffff";
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-sky)`} />
      <Pole uid={uid} x={140} y1={50} y2={450} />
      <WavingFlag uid={uid} id="pavl" x={x} y={y} w={w} h={h}>
        <rect x={x} y={y - 20} width={w} height={h + 40} fill={bg} />
        <Logo x={x + w * 0.2} y={y + h * 0.15} w={w * 0.6} h={h * 0.7} logoUrl={logoUrl} dark={dark} />
      </WavingFlag>
    </g>
  );
}

/** A cord with hanging pennants. */
function Garland({ uid, render, count = 7, triangle = false }: { uid: string; render: (i: number, x: number, y: number, w: number, h: number, key: string) => React.ReactNode; count?: number; triangle?: boolean }) {
  const x0 = 20, x1 = 580, sag = 70, top = 90;
  const cordY = (t: number) => top + 4 * sag * t * (1 - t);
  const w = 62, h = triangle ? 90 : 84;
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-wall)`} />
      {[0, 1].map((row) => (
        <g key={row} transform={`translate(0 ${row * 190})`} opacity={row ? 0.9 : 1}>
          <path d={`M${x0},${top} Q300,${top + 2 * sag} ${x1},${top}`} fill="none" stroke="#6b4f2a" strokeWidth="3" />
          {Array.from({ length: count }, (_, i) => {
            const t = (i + 0.5) / count;
            const cx = x0 + (x1 - x0) * t;
            const cy = cordY(t);
            const angle = (Math.atan(4 * sag * (1 - 2 * t) / (x1 - x0)) * 180) / Math.PI;
            return (
              <g key={i} transform={`rotate(${angle} ${cx} ${cy})`} filter={`url(#${uid}-shadow)`}>
                {render(i + row, cx - w / 2, cy, w, h, `${row}-${i}`)}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

function RectPennant({ uid, id, x, y, w, h, children }: { uid: string; id: string; x: number; y: number; w: number; h: number; children: React.ReactNode }) {
  return (
    <g>
      <clipPath id={`${uid}-${id}`}>
        <rect x={x} y={y} width={w} height={h} rx="2" />
      </clipPath>
      <g clipPath={`url(#${uid}-${id})`}>
        {children}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-vfolds)`} opacity="0.6" />
      </g>
    </g>
  );
}

function Guirlande({ uid, s }: SceneProps) {
  return (
    <Garland uid={uid} render={(i, x, y, w, h, k) => (
      <RectPennant uid={uid} id={`g${k}`} x={x} y={y} w={w} h={h}>
        <image href={flag(s.country)} x={x - w * 0.35} y={y} width={w * 1.7} height={h} preserveAspectRatio="xMidYMid slice" />
      </RectPennant>
    )} />
  );
}

function GuirlandeMixte({ uid, s, logoUrl }: SceneProps) {
  return (
    <Garland uid={uid} render={(i, x, y, w, h, k) => (
      <RectPennant uid={uid} id={`gm${k}`} x={x} y={y} w={w} h={h}>
        {i % 2 === 0 ? (
          <image href={flag(s.country)} x={x - w * 0.35} y={y} width={w * 1.7} height={h} preserveAspectRatio="xMidYMid slice" />
        ) : (
          <>
            <rect x={x} y={y} width={w} height={h} fill="#fff" />
            <Logo x={x + 5} y={y + 10} w={w - 10} h={h - 20} logoUrl={logoUrl} />
          </>
        )}
      </RectPennant>
    )} />
  );
}

function GuirlandeLogo({ uid, logoUrl }: SceneProps) {
  return (
    <Garland uid={uid} render={(i, x, y, w, h, k) => (
      <RectPennant uid={uid} id={`gl${k}`} x={x} y={y} w={w} h={h}>
        <rect x={x} y={y} width={w} height={h} fill="#fff" />
        <Logo x={x + 5} y={y + 10} w={w - 10} h={h - 20} logoUrl={logoUrl} />
      </RectPennant>
    )} />
  );
}

function GuirlandeTriangles({ uid }: SceneProps) {
  const palette = ["#dc2626", "#7c3aed", "#dc2626", "#16a34a", "#dc2626", "#ea580c", "#dc2626", "#14b8a6", "#dc2626", "#eab308"];
  return (
    <Garland uid={uid} count={9} triangle render={(i, x, y, w, h) => (
      <g>
        <path d={`M${x},${y} L${x + w},${y} L${x + w / 2},${y + h} Z`} fill={palette[i % palette.length]} />
        <path d={`M${x},${y} L${x + w},${y} L${x + w / 2},${y + h} Z`} fill={`url(#${uid}-vfolds)`} opacity="0.5" />
      </g>
    )} />
  );
}

/** A long banner hung on a facade, with grommets. */
function BannerFrame({ uid, x, y, w, h, id, children }: { uid: string; x: number; y: number; w: number; h: number; id: string; children: React.ReactNode }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <clipPath id={`${uid}-${id}`}>
        <rect x={x} y={y} width={w} height={h} rx="3" />
      </clipPath>
      <g clipPath={`url(#${uid}-${id})`}>
        {children}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-folds)`} opacity="0.35" />
      </g>
      {[[x + 10, y + 10], [x + w - 10, y + 10], [x + 10, y + h - 10], [x + w - 10, y + h - 10]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.5" fill="#d4d4d8" stroke="#52525b" strokeWidth="1.5" />
      ))}
    </g>
  );
}

function Facade({ uid }: { uid: string }) {
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-wall)`} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="0" x2="600" y1={i * 50 + 25} y2={i * 50 + 25} stroke="#d6c7ae" strokeWidth="1" />
      ))}
    </g>
  );
}

function BanderoleTexte({ uid, s }: SceneProps) {
  const bg = COLORS[s.color ?? "red"] ?? "#c8102e";
  const fg = bg === "#ffffff" ? "#b91c1c" : "#ffffff";
  const text = (s.text ?? "").trim() || "TEX BANNER";
  const lines = text.split("\n").slice(0, 2);
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const [x, y, w, h] = [20, 170, 560, 96];
  const fontSize = Math.max(14, Math.min(50 / lines.length, (w * 1.7) / longest));
  return (
    <g>
      <Facade uid={uid} />
      <BannerFrame uid={uid} id="bt" x={x} y={y} w={w} h={h}>
        <rect x={x} y={y} width={w} height={h} fill={bg} />
        <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke={fg} strokeOpacity="0.5" strokeWidth="1.5" />
        {lines.map((l, i) => (
          <text key={i} x={300} y={y + h / 2 + (i - (lines.length - 1) / 2) * fontSize * 1.15} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight="800" fill={fg} fontFamily="Cairo Variable, sans-serif" direction={/[؀-ۿ]/.test(l) ? "rtl" : "ltr"}>
            {l}
          </text>
        ))}
      </BannerFrame>
    </g>
  );
}

function BanderoleLogo({ uid, s, logoUrl }: SceneProps) {
  const [x, y, w, h] = [20, 170, 560, 96];
  return (
    <g>
      <Facade uid={uid} />
      <BannerFrame uid={uid} id="bl" x={x} y={y} w={w} h={h}>
        <rect x={x} y={y} width={w} height={h} fill="#c8102e" />
        {[0, 1, 2, 3].map((i) => {
          const cx = x + (w / 4) * (i + 0.5);
          return i % 2 === 0 ? (
            <g key={i}>
              <circle cx={cx} cy={y + h / 2} r="38" fill="#fff" />
              <Logo x={cx - 32} y={y + h / 2 - 32} w={64} h={64} logoUrl={logoUrl} />
            </g>
          ) : (
            <image key={i} href={flag(s.country)} x={cx - 50} y={y + 14} width={100} height={h - 28} preserveAspectRatio="xMidYMid meet" />
          );
        })}
      </BannerFrame>
    </g>
  );
}

function BanderoleDrapeaux({ uid, s }: SceneProps) {
  const vertical = s.orientation === "vertical";
  const [x, y, w, h] = vertical ? [240, 25, 120, 400] : [20, 160, 560, 120];
  const cols = vertical ? 2 : 8, rows = vertical ? 8 : 2;
  const cw = w / cols, ch = h / rows;
  return (
    <g>
      <Facade uid={uid} />
      <BannerFrame uid={uid} id="bd" x={x} y={y} w={w} h={h}>
        <rect x={x} y={y} width={w} height={h} fill="#fff" />
        {Array.from({ length: rows * cols }, (_, i) => (
          <image key={i} href={flag(s.country)} x={x + (i % cols) * cw + 4} y={y + Math.floor(i / cols) * ch + 4} width={cw - 8} height={ch - 8} preserveAspectRatio="xMidYMid meet" />
        ))}
      </BannerFrame>
    </g>
  );
}

function Swallowtail({ uid, id, x, y, w, h, children }: { uid: string; id: string; x: number; y: number; w: number; h: number; children: React.ReactNode }) {
  const d = `M${x},${y} H${x + w} V${y + h} L${x + w / 2},${y + h - w * 0.45} L${x},${y + h} Z`;
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <clipPath id={`${uid}-${id}`}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${uid}-${id})`}>
        {children}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-vfolds)`} />
      </g>
      <rect x={x - 6} y={y - 6} width={w + 12} height="8" rx="3" fill={`url(#${uid}-steel)`} />
    </g>
  );
}

function StreetScene({ uid, render }: { uid: string; render: (x: number, y: number, w: number, h: number, id: string) => React.ReactNode }) {
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-sky)`} />
      <rect y="400" width="600" height="50" fill="#cbd5e1" />
      {[150, 450].map((px, i) => (
        <g key={px} opacity={i ? 0.55 : 1} transform={i ? `translate(${px} 70) scale(0.7) translate(${-px} 0)` : undefined}>
          <Pole uid={uid} x={px} y1={30} y2={420} w={10} />
          <path d={`M${px},40 Q${px + 60},20 ${px + 110},40`} fill="none" stroke="#9ca3af" strokeWidth="6" />
          <ellipse cx={px + 115} cy={44} rx="24" ry="8" fill="#e5e7eb" />
          {render(px + 12, 90, 96, 290, `o${i}`)}
        </g>
      ))}
    </g>
  );
}

function Oriflamme({ uid, s }: SceneProps) {
  return (
    <StreetScene uid={uid} render={(x, y, w, h, id) => (
      <Swallowtail uid={uid} id={id} x={x} y={y} w={w} h={h}>
        <image href={flag(s.country)} x={x - h * 0.3} y={y} width={h * 1.1} height={h} preserveAspectRatio="xMidYMid slice" />
      </Swallowtail>
    )} />
  );
}

function OriflammeLogo({ uid, s, logoUrl }: SceneProps) {
  const bg = COLORS[s.color ?? "white"] ?? "#fff";
  return (
    <StreetScene uid={uid} render={(x, y, w, h, id) => (
      <Swallowtail uid={uid} id={id} x={x} y={y} w={w} h={h}>
        <rect x={x} y={y} width={w} height={h} fill={bg} />
        <Logo x={x + 8} y={y + h * 0.22} w={w - 16} h={w - 16} logoUrl={logoUrl} dark={bg !== "#ffffff"} />
      </Swallowtail>
    )} />
  );
}

function Fringe({ uid, x, y, w }: { uid: string; x: number; y: number; w: number }) {
  return <line x1={x} x2={x + w} y1={y + 7} y2={y + 7} stroke={`url(#${uid}-gold)`} strokeWidth="14" strokeDasharray="2 2.5" />;
}

function FanionSalon({ uid, s }: SceneProps) {
  const [x, y, w, h] = [262, 60, 130, 300];
  return (
    <g>
      <rect width="600" height="450" fill="#3b2a1a" />
      <rect width="600" height="450" fill={`url(#${uid}-wall)`} opacity="0.12" />
      <rect x="251" y="30" width="8" height="400" rx="4" fill={`url(#${uid}-gold)`} />
      <path d="M255,8 L263,30 H247 Z" fill={`url(#${uid}-gold)`} />
      <ellipse cx="255" cy="432" rx="55" ry="12" fill={`url(#${uid}-gold)`} />
      <g filter={`url(#${uid}-shadow)`}>
        <clipPath id={`${uid}-fs`}>
          <path d={`M${x},${y} H${x + w} C${x + w + 6},${y + h * 0.5} ${x + w - 8},${y + h * 0.8} ${x + w},${y + h} H${x} Z`} />
        </clipPath>
        <g clipPath={`url(#${uid}-fs)`}>
          <image href={flag(s.country)} x={x - h * 0.5} y={y} width={h * 1.33} height={h} preserveAspectRatio="xMidYMid slice" transform={`rotate(0)`} />
          <rect x={x} y={y} width={w + 10} height={h} fill={`url(#${uid}-vfolds)`} />
          <rect x={x} y={y} width={w + 10} height={h} fill="#fff" opacity="0.08" />
        </g>
        <Fringe uid={uid} x={x} y={y + h} w={w} />
      </g>
    </g>
  );
}

function TableFlag({ uid, id, px, code, side = "right", tilt = 0 }: { uid: string; id: string; px: number; code?: string; side?: "left" | "right"; tilt?: number }) {
  const w = 120, h = 80, y = 130;
  const x = side === "right" ? px + 3 : px - 3 - w;
  const edge = side === "right" ? x + w + 5 : x - 5;
  const baseY = 330;
  return (
    <g transform={`rotate(${tilt} ${px} ${baseY})`}>
      <rect x={px - 2.5} y={110} width="5" height={baseY - 110} fill={`url(#${uid}-gold)`} />
      <circle cx={px} cy={108} r="6" fill={`url(#${uid}-gold)`} />
      <g filter={`url(#${uid}-shadow)`}>
        <clipPath id={`${uid}-${id}`}>
          <path d={`M${x},${y} C${x + w * 0.4},${y + 6} ${x + w * 0.7},${y - 6} ${x + w},${y + 3} V${y + h + 3} C${x + w * 0.7},${y + h - 6} ${x + w * 0.4},${y + h + 6} ${x},${y + h} Z`} />
        </clipPath>
        <g clipPath={`url(#${uid}-${id})`}>
          <image href={flag(code)} x={x} y={y - 4} width={w} height={h + 10} preserveAspectRatio="none" />
          <rect x={x} y={y - 6} width={w} height={h + 12} fill={`url(#${uid}-folds)`} />
        </g>
        <line x1={edge} x2={edge} y1={y + 3} y2={y + h + 3} stroke={`url(#${uid}-gold)`} strokeWidth="9" strokeDasharray="2 2" />
      </g>
    </g>
  );
}

function FanionTable({ uid, s }: SceneProps) {
  const double = s.model === "double";
  return (
    <g>
      <rect width="600" height="450" fill="#f1ece4" />
      <rect y="330" width="600" height="120" fill="#6b4226" />
      <rect y="330" width="600" height="8" fill="#4a2c17" />
      {double ? (
        <g>
          <TableFlag uid={uid} id="t1" px={300} code={s.country} side="left" tilt={-14} />
          <TableFlag uid={uid} id="t2" px={300} code={s.country2} side="right" tilt={14} />
          <ellipse cx="300" cy="332" rx="50" ry="11" fill={`url(#${uid}-gold)`} />
        </g>
      ) : (
        <g>
          <TableFlag uid={uid} id="t1" px={260} code={s.country} />
          <ellipse cx="260" cy="332" rx="40" ry="10" fill={`url(#${uid}-gold)`} />
        </g>
      )}
    </g>
  );
}

function FanionClub({ uid, s, logoUrl }: SceneProps) {
  const x = 220, y = 80, w = 160, h = 240;
  const d = `M${x},${y} H${x + w} V${y + h * 0.72} L${x + w / 2},${y + h} L${x},${y + h * 0.72} Z`;
  const text = (s.text ?? "").trim();
  return (
    <g>
      <rect width="600" height="450" fill="#e7e5e4" />
      <path d={`M300,20 L${x + 6},${y} M300,20 L${x + w - 6},${y}`} stroke="#c9a227" strokeWidth="3" fill="none" />
      <circle cx="300" cy="20" r="6" fill="#c9a227" />
      <g filter={`url(#${uid}-shadow)`}>
        <rect x={x - 12} y={y - 6} width={w + 24} height="10" rx="5" fill={`url(#${uid}-gold)`} />
        <clipPath id={`${uid}-fc`}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#${uid}-fc)`}>
          <rect x={x} y={y} width={w} height={h} fill="#ffffff" />
          <rect x={x} y={y} width={w} height="26" fill="#c8102e" />
          <Logo x={x + 25} y={y + 40} w={w - 50} h={w - 50} logoUrl={logoUrl} />
          {text && (
            <text x={300} y={y + h * 0.66} textAnchor="middle" fontSize={Math.min(20, 280 / Math.max(text.length, 1))} fontWeight="700" fill="#111" fontFamily="Cairo Variable, sans-serif">
              {text}
            </text>
          )}
          <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}-vfolds)`} opacity="0.5" />
        </g>
        <path d={`M${x},${y + h * 0.72} L${x + w / 2},${y + h} L${x + w},${y + h * 0.72}`} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="10" strokeDasharray="2 2" />
      </g>
    </g>
  );
}

function BeachFlag({ uid, s, logoUrl }: SceneProps) {
  const bg = COLORS[s.color ?? "red"] ?? "#c8102e";
  const tall = s.height === "3.5m";
  const x = 250, top = tall ? 20 : 70, bottom = 390, w = 110;
  const rect = s.shape === "rectangle";
  const d = rect
    ? `M${x},${top} H${x + w} V${bottom - 20} H${x} Z`
    : `M${x},${top + 40} C${x},${top} ${x + w * 1.1},${top - 10} ${x + w},${top + 80} C${x + w * 0.9},${bottom - 150} ${x + w * 0.6},${bottom - 60} ${x},${bottom - 40} Z`;
  const text = (s.text ?? "").trim() || "TEX BANNER";
  const len = bottom - top - 120;
  return (
    <g>
      <rect width="600" height="450" fill={`url(#${uid}-sky)`} />
      <rect y="390" width="600" height="60" fill="#f5deb3" />
      <path d={`M${x - 3},${top + (rect ? 0 : 20)} V420`} stroke="#6b7280" strokeWidth="5" />
      {s.kit === "kit" && <path d={`M${x - 40},430 L${x - 3},415 L${x + 34},430 M${x - 3},415 V432`} stroke="#374151" strokeWidth="6" fill="none" strokeLinecap="round" />}
      <g filter={`url(#${uid}-shadow)`}>
        <clipPath id={`${uid}-bf`}>
          <path d={d} />
        </clipPath>
        <g clipPath={`url(#${uid}-bf)`}>
          <rect x={x - 10} y={top - 20} width={w + 40} height={bottom - top + 20} fill={bg} />
          <Logo x={x + 18} y={top + (rect ? 14 : 50)} w={w - 36} h={w - 36} logoUrl={logoUrl} dark={bg !== "#ffffff"} />
          <text transform={rect ? `translate(${x + w / 2} ${top + w + 40 + len / 2}) rotate(-90)` : `translate(${x + 36} ${top + 175}) rotate(-90)`} textAnchor="middle" dominantBaseline="central" fontSize={rect ? Math.min(34, (len * 1.5) / Math.max(text.length, 1)) : Math.min(22, 200 / Math.max(text.length, 1))} fontWeight="800" fill={bg === "#ffffff" ? "#111" : "#fff"} fontFamily="Cairo Variable, sans-serif">
            {text}
          </text>
          <rect x={x - 10} y={top - 20} width={w + 40} height={bottom - top + 20} fill={`url(#${uid}-folds)`} opacity="0.6" />
        </g>
      </g>
    </g>
  );
}

const SCENES: Record<PreviewKind, (p: SceneProps) => React.ReactElement> = {
  pavillon: Pavillon,
  "pavillon-logo": PavillonLogo,
  guirlande: Guirlande,
  "guirlande-mixte": GuirlandeMixte,
  "guirlande-logo": GuirlandeLogo,
  "guirlande-triangles": GuirlandeTriangles,
  "banderole-texte": BanderoleTexte,
  "banderole-logo": BanderoleLogo,
  "banderole-drapeaux": BanderoleDrapeaux,
  oriflamme: Oriflamme,
  "oriflamme-logo": OriflammeLogo,
  "fanion-salon": FanionSalon,
  "fanion-table": FanionTable,
  "fanion-club": FanionClub,
  beachflag: BeachFlag,
};
