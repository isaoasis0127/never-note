import { readFile } from "node:fs/promises";
import path from "node:path";

// Subsetted Noto Sans CJK JP (regular weight only) containing just the
// glyphs used in the generated OGP/Twitter Card banner (see
// lib/brandImage.jsx). Satori (the renderer behind next/og's
// ImageResponse) doesn't use system fonts, so any Japanese text needs
// an explicit font with CJK glyphs or it renders as tofu boxes.
//
// Regenerating: if the banner's Japanese copy changes, the subset
// must be rebuilt with the new characters, e.g.:
//   python3 -m fontTools.subset NotoSansCJKjp-Regular.otf \
//     --output-file=assets/fonts/NotoSansJP-subset.otf \
//     --text="<all characters used in lib/brandImage.jsx>" \
//     --no-layout-closure
// (source font: notofonts/noto-cjk, Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf)
let cachedFont;

export async function loadBrandFont() {
  if (!cachedFont) {
    cachedFont = await readFile(path.join(process.cwd(), "assets/fonts/NotoSansJP-subset.otf"));
  }
  return cachedFont;
}
