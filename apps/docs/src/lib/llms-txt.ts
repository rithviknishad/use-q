import { docsNav, flatNav } from "../config/docs-nav";
import { getAllDocs, type Doc } from "./docs";

export const SITE_URL = "https://use-q.dev";

const SITE_DESCRIPTION =
  "An opinionated, schema-driven way to use TanStack Query v5 — TkDodo's Practical React Query patterns as a typed API client.";

export type MarkdownPage = {
  /** Site path of the HTML page, e.g. `/docs/react/use-q`. */
  href: string;
  /** Path relative to `public/`, e.g. `docs/react/use-q.md`. */
  filePath: string;
  content: string;
};

export function markdownHref(href: string): string {
  return `${href.replace(/\/$/, "")}.md`;
}

export function absoluteMarkdownUrl(href: string, hash?: string): string {
  const url = `${SITE_URL}${markdownHref(href)}`;
  return hash ? `${url}#${hash}` : url;
}

function docsInNavOrder(): Doc[] {
  const remaining = new Map(getAllDocs().map((doc) => [doc.href, doc]));
  const ordered: Doc[] = [];
  for (const item of flatNav) {
    const doc = remaining.get(item.href);
    if (doc) {
      ordered.push(doc);
      remaining.delete(item.href);
    }
  }
  ordered.push(...remaining.values());
  return ordered;
}

/** Convert MDX chrome (Callout, Tabs, Steps, …) into Markdown agents can read. */
export function mdxToLlmMarkdown(source: string): string {
  const fences: string[] = [];
  let out = source.replace(/```[\s\S]*?```/g, (block) => {
    fences.push(block);
    return `<<<FENCE_${fences.length - 1}>>>`;
  });

  out = out.replace(
    /<Callout(?:\s+type="(\w+)")?(?:\s+title="([^"]*)")?\s*>\s*([\s\S]*?)\s*<\/Callout>/g,
    (_match, type: string | undefined, title: string | undefined, body: string) => {
      const label = title ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : "Note");
      const quoted = body
        .trim()
        .split("\n")
        .map((line) => (line.length ? `> ${line}` : ">"))
        .join("\n");
      return `> **${label}:**\n${quoted}`;
    },
  );

  out = out.replace(/<TabsList>[\s\S]*?<\/TabsList>/g, "");
  out = out.replace(
    /<TabsContent\s+value="([^"]+)"\s*>\s*/g,
    (_match, value: string) => `\n**${value}**\n\n`,
  );
  out = out.replace(/<\/TabsContent>/g, "");
  out = out.replace(/<\/?Tabs\b[^>]*>/g, "");

  out = out.replace(/<\/?Steps>/g, "");
  out = out.replace(/<\/?CardGrid>/g, "");
  out = out.replace(/<\/?Badge\b[^>]*>/g, "");

  out = out.replace(
    /^[ \t]*<LinkCard\s+title="([^"]+)"\s+href="([^"]+)"\s*>\s*([\s\S]*?)\s*<\/LinkCard>/gm,
    (_match, title: string, href: string, body: string) => {
      const desc = body.trim().replace(/\s+/g, " ");
      const link = `- [${title}](${toAbsoluteMarkdownLink(href)})`;
      return desc ? `${link}: ${desc}` : link;
    },
  );

  out = out.replace(/\]\((\/[^)]*)\)/g, (_match, href: string) => {
    return `](${toAbsoluteMarkdownLink(href)})`;
  });

  out = out.replace(/<<<FENCE_(\d+)>>>/g, (_match, index: string) => fences[Number(index)] ?? "");

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function toAbsoluteMarkdownLink(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const [path, hash] = href.split("#");
  const normalized = (path ?? href).replace(/\/$/, "") || "/";
  if (normalized === "/") {
    return hash ? `${SITE_URL}/#${hash}` : `${SITE_URL}/`;
  }
  if (normalized.startsWith("/docs")) {
    return absoluteMarkdownUrl(normalized, hash);
  }
  const url = `${SITE_URL}${normalized}`;
  return hash ? `${url}#${hash}` : url;
}

function renderDocMarkdown(doc: Doc): string {
  const lines = [`# ${doc.frontmatter.title}`];
  if (doc.frontmatter.description) {
    lines.push("", `> ${doc.frontmatter.description}`);
  }
  lines.push("", mdxToLlmMarkdown(doc.content), "");
  return lines.join("\n");
}

export function getMarkdownPages(): MarkdownPage[] {
  return docsInNavOrder().map((doc) => ({
    href: doc.href,
    filePath: `${doc.href.replace(/^\//, "")}.md`,
    content: renderDocMarkdown(doc),
  }));
}

export function getLlmsTxt(): string {
  const pages = getMarkdownPages();
  const byHref = new Map(pages.map((page) => [page.href, page]));

  const lines = [
    "# use-q",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "use-q is a typed API client on TanStack Query v5. Fetch this index first, then follow links to Markdown pages. Prefer `/llms-full.txt` when you need the complete corpus in one request.",
    "",
    "Packages: `@use-q/api-client` (zero-dependency core), `@use-q/api-client-react` (hooks), `@use-q/api-client-codegen` (OpenAPI → schema).",
    "",
  ];

  for (const group of docsNav) {
    lines.push(`## ${group.title}`, "");
    for (const item of group.items) {
      const page = byHref.get(item.href);
      const desc = page ? descriptionFor(page) : undefined;
      const url = absoluteMarkdownUrl(item.href);
      lines.push(desc ? `- [${item.title}](${url}): ${desc}` : `- [${item.title}](${url})`);
    }
    lines.push("");
  }

  lines.push(
    "## Optional",
    "",
    `- [Complete documentation](${SITE_URL}/llms-full.txt): Every page concatenated into one Markdown file.`,
    `- [HTML documentation](${SITE_URL}/docs/): Human-readable docs site.`,
    "- [GitHub](https://github.com/rithviknishad/use-q)",
    "",
  );

  return lines.join("\n");
}

function descriptionFor(page: MarkdownPage): string | undefined {
  const match = /^> (.+)$/m.exec(page.content);
  return match?.[1];
}

export function getLlmsFullTxt(): string {
  const pages = getMarkdownPages();
  const parts = [
    "# use-q",
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Complete documentation. Index: ${SITE_URL}/llms.txt`,
    "",
  ];

  for (const page of pages) {
    parts.push("---", "", page.content.trim(), "");
  }

  return parts.join("\n");
}
