import { ImageResponse } from "next/og";
import { BrandTile } from "@/lib/brandImage";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandTile width={size.width} height={size.height} />, { ...size });
}
