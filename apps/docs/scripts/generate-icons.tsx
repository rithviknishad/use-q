/**
 * Renders the favicon, raster icons, and social share card into `public/`.
 *
 * These are committed rather than produced by Next's `icon`/`opengraph-image`
 * conventions because `output: "export"` emits those routes as extension-less
 * files, which static hosts serve without an `image/*` content type — social
 * crawlers reject them.
 *
 * The mark is authored once as SVG (see `LOGO_GEOMETRY`) and rasterized with
 * resvg, so no rendering hand-copies the geometry. Run with `pnpm gen:icons`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { ImageResponse } from "next/og";
import { LOGO_GEOMETRY, logoPaths } from "../src/components/docs/logo";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function markSvg({ rounded }: { rounded: boolean }) {
  const {
    viewBox,
    tileRadius,
    centre,
    arcRadius,
    strokeWidth,
    nodeRadius,
    tileFrom,
    tileTo,
    glyph,
  } = LOGO_GEOMETRY;
  const { arc, arrowHead } = logoPaths();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${viewBox}" height="${viewBox}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="${viewBox}" y2="${viewBox}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${tileFrom}" />
      <stop offset="1" stop-color="${tileTo}" />
    </linearGradient>
  </defs>
  <rect width="${viewBox}" height="${viewBox}" rx="${rounded ? tileRadius : 0}" fill="url(#tile)" />
  <circle cx="${centre}" cy="${centre}" r="${nodeRadius}" fill="${glyph}" />
  <path d="${arc}" fill="none" stroke="${glyph}" stroke-width="${strokeWidth}" stroke-linecap="round" />
  <polygon points="${arrowHead}" fill="${glyph}" />
</svg>
`;
}

function rasterize(svg: string, width: number) {
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng(),
  );
}

/**
 * Satori only handles a narrow subset of SVG, so the share card embeds the mark
 * as an already-rasterized PNG rather than re-describing the geometry.
 */
function shareCard(markDataUri: string) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "0 88px",
        background: "#0a0a0a",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.22), transparent 70%)",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <img src={markDataUri} width={96} height={96} alt="" />
        <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: -2 }}>
          use-q
        </div>
      </div>
      <div
        style={{
          marginTop: 44,
          fontSize: 62,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: -2,
          maxWidth: 900,
        }}
      >
        Your API schema is the source of truth
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 30,
          lineHeight: 1.4,
          color: "#a3a3a3",
          maxWidth: 940,
        }}
      >
        One schema becomes fully typed, cache-aware React hooks — invalidation,
        optimistic updates, and pagination included.
      </div>
      <div
        style={{ display: "flex", marginTop: 52, fontSize: 26, color: "#34d399" }}
      >
        use-q.dev
      </div>
    </div>
  );
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const rounded = markSvg({ rounded: true });
  // iOS masks touch icons itself, so that one ships full-bleed and unrounded.
  const fullBleed = markSvg({ rounded: false });

  const written: string[] = [];
  const write = async (file: string, data: Buffer | string) => {
    await writeFile(join(PUBLIC_DIR, file), data);
    const bytes = typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
    written.push(`${file} — ${(bytes / 1024).toFixed(1)} kB`);
  };

  await write("favicon.svg", rounded);
  await write("icon-32.png", rasterize(rounded, 32));
  await write("icon-512.png", rasterize(rounded, 512));
  await write("apple-touch-icon.png", rasterize(fullBleed, 180));

  const markDataUri = `data:image/png;base64,${rasterize(rounded, 192).toString("base64")}`;
  const card = new ImageResponse(shareCard(markDataUri), {
    width: 1200,
    height: 630,
  });
  await write("og.png", Buffer.from(await card.arrayBuffer()));

  console.log(written.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
