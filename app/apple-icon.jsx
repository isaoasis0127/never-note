import { ImageResponse } from "next/og";
import { BrandTile } from "@/lib/brandImage";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandTile width={size.width} height={size.height} />, { ...size });
}
