/**
 * Writes LLM-readable docs into `public/` so the static export serves real
 * `.txt` / `.md` files with the right content types. Next route handlers under
 * `output: "export"` emit extension-less files that hosts often mis-label.
 *
 * Run via `pnpm gen:llms` (also hooked as predev / prebuild).
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getLlmsFullTxt, getLlmsTxt, getMarkdownPages } from "../src/lib/llms-txt";

const DOCS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(DOCS_ROOT, "public");

async function main() {
  process.chdir(DOCS_ROOT);

  const pages = getMarkdownPages();
  await rm(join(PUBLIC_DIR, "docs.md"), { force: true });
  await rm(join(PUBLIC_DIR, "docs"), { recursive: true, force: true });

  await writeFile(join(PUBLIC_DIR, "llms.txt"), getLlmsTxt(), "utf8");
  await writeFile(join(PUBLIC_DIR, "llms-full.txt"), getLlmsFullTxt(), "utf8");

  for (const page of pages) {
    const dest = join(PUBLIC_DIR, page.filePath);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, page.content, "utf8");
  }

  console.log(
    `Wrote llms.txt, llms-full.txt, and ${pages.length} Markdown pages to public/`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
