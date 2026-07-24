import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

export type DocFrontmatter = {
  title: string;
  description?: string;
};

export type DocHeading = {
  level: number;
  text: string;
  slug: string;
};

export type Doc = {
  slug: string[];
  href: string;
  frontmatter: DocFrontmatter;
  content: string;
  headings: DocHeading[];
};

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) return [full];
    return [];
  });
}

function fileToSlug(file: string): string[] {
  const rel = path.relative(CONTENT_DIR, file).replace(/\.mdx?$/, "");
  const parts = rel.split(path.sep);
  if (parts[parts.length - 1] === "index") parts.pop();
  return parts;
}

function extractHeadings(content: string): DocHeading[] {
  const slugger = new GithubSlugger();
  const headings: DocHeading[] = [];
  // Strip fenced code blocks so we don't pick up comments as headings
  const withoutCode = content.replace(/```[\s\S]*?```/g, "");
  for (const line of withoutCode.split("\n")) {
    const match = /^(#{2,4})\s+(.*)$/.exec(line.trim());
    if (match) {
      const text = match[2].replace(/[*_`]/g, "").trim();
      headings.push({
        level: match[1].length,
        text,
        slug: slugger.slug(text),
      });
    }
  }
  return headings;
}

export function getAllDocs(): Doc[] {
  return walk(CONTENT_DIR).map((file) => {
    const raw = fs.readFileSync(file, "utf-8");
    const { data, content } = matter(raw);
    const slug = fileToSlug(file);
    return {
      slug,
      href: slug.length ? `/docs/${slug.join("/")}` : "/docs",
      frontmatter: data as DocFrontmatter,
      content,
      headings: extractHeadings(content),
    };
  });
}

export function getDoc(slug: string[]): Doc | undefined {
  return getAllDocs().find((doc) => doc.slug.join("/") === slug.join("/"));
}

export type SearchEntry = {
  title: string;
  description?: string;
  href: string;
  group?: string;
  headings: { text: string; slug: string }[];
};

export function getSearchIndex(): SearchEntry[] {
  return getAllDocs().map((doc) => ({
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    href: doc.href,
    headings: doc.headings
      .filter((h) => h.level === 2)
      .map((h) => ({ text: h.text, slug: h.slug })),
  }));
}
