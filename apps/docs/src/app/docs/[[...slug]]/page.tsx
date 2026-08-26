import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllDocs, getDoc } from "@/lib/docs";
import { markdownHref } from "@/lib/llms-txt";
import { findGroup } from "@/config/docs-nav";
import { Mdx } from "@/components/docs/mdx";
import { TableOfContents } from "@/components/docs/toc";
import { DocsPager } from "@/components/docs/pager";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Params = { slug?: string[] };

export function generateStaticParams(): Params[] {
  return getAllDocs().map((doc) => ({
    slug: doc.slug.length ? doc.slug : undefined,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug = [] } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    alternates: {
      types: {
        "text/markdown": markdownHref(doc.href),
      },
    },
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug = [] } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const group = findGroup(doc.href);

  return (
    <div className="flex gap-10 px-4 py-8 sm:px-8 lg:px-12">
      <article className="mx-auto w-full min-w-0 max-w-3xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/docs">Docs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {group && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>{group.title}</BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{doc.frontmatter.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-semibold tracking-tight">
          {doc.frontmatter.title}
        </h1>
        {doc.frontmatter.description && (
          <p className="mt-2 text-base text-soft-foreground">
            {doc.frontmatter.description}
          </p>
        )}

        <div className="docs-prose mt-8">
          <Mdx source={doc.content} />
        </div>

        <DocsPager href={doc.href} />
      </article>

      <aside className="sticky top-22 hidden h-fit w-56 shrink-0 xl:block">
        <TableOfContents headings={doc.headings} />
      </aside>
    </div>
  );
}
