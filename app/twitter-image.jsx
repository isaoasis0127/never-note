import { ImageResponse } from "next/og";
import { BrandBanner } from "@/lib/brandImage";
import { loadBrandFont } from "@/lib/loadFont";

export const alt = "Never Note — 招待コードを知っている人だけが参加できる共同ノート";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  const fontData = await loadBrandFont();
  return new ImageResponse(
    <BrandBanner width={size.width} height={size.height} title="Never Note" tagline="招待コードで参加する共同ノート" />,
    {
      ...size,
      fonts: [{ name: "Noto Sans JP", data: fontData, style: "normal", weight: 400 }],
    }
  );
}
