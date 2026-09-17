import Image from "next/image";
import logo from "../../public/images/logo-texbanner.webp";

/** Official Sté Tex Banner logo (red oval, FR + AR wordmark). */
export function Brand({ size = "md", priority = false }: { size?: "sm" | "md" | "lg"; priority?: boolean }) {
  const height = { sm: 56, md: 80, lg: 128 }[size];
  return (
    <Image
      src={logo}
      alt="Sté Tex Banner — شركة تاكس بانر"
      height={height}
      style={{ width: "auto", height }}
      priority={priority}
      className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
    />
  );
}
