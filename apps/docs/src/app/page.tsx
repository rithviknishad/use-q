import Link from "next/link";
import { codeToHtml } from "shiki";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Braces,
  FileJson2,
  Rocket,
  Settings2,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/docs/site-header";

const features = [
  {
    icon: ShieldCheck,
    title: "End-to-end type safety",
    description:
      "Path params, search params, bodies, responses, and error payloads are all inferred from a single schema. No `any` leaks into your components.",
    href: "/docs/getting-started/schema-definition",
  },
  {
    icon: Boxes,
    title: "Framework-agnostic core",
    description:
      "A tiny zero-dependency fetcher that runs in Node, Bun, Deno, edge workers, or the browser. No React required.",
    href: "/docs/core/create-fetcher",
  },
  {
    icon: Tags,
    title: "Schema-driven invalidation",
    description:
      "Tag routes once and mutations automatically refresh the right queries through a shared TagRegistry.",
    href: "/docs/guides/tag-invalidation",
  },
  {
    icon: Rocket,
    title: "Optimistic updates that compose",
    description:
      "Update multiple caches per mutation with snapshot and rollback semantics built in.",
    href: "/docs/guides/optimistic-updates",
  },
  {
    icon: FileJson2,
    title: "OpenAPI codegen",
    description:
      "Generate a typed schema straight from an OpenAPI 3.x spec. Pagination is detected automatically.",
    href: "/docs/core/codegen",
  },
  {
    icon: Settings2,
    title: "Bring your own QueryClient",
    description:
      "Reuse one QueryClient across clients, or hook into persistence and devtools — use-q never gets in the way.",
    href: "/docs/guides/byo-query-client",
  },
];

const heroSnippet = `const schema = {
  listPosts: {
    method: "GET",
    path: "/facilities/{facilityId}/posts",
    tags: ["posts"],
  } satisfies RouteDefinition<
    { facilityId: string }, // path params
    { search?: string },    // search params
    never,                  // body
    Post[]                  // response
  >,
  createPost: {
    method: "POST",
    path: "/facilities/{facilityId}/posts",
    invalidatesTags: ["posts"],
  } satisfies RouteDefinition<{ facilityId: string }, never, { title: string }, Post>,
} as const;

export const api = createApiClient(schema, {
  baseUrl: "https://api.example.com",
});`;

const usageSnippet = `function PostList({ facilityId }: { facilityId: string }) {
  // data is Post[] — inferred, not asserted
  const { data } = api.useQ("listPosts", { params: { facilityId } });
  const createPost = api.useM("createPost");

  // listPosts refetches automatically after this succeeds
  return (
    <button
      onClick={() =>
        createPost.mutate({ params: { facilityId }, body: { title: "Hi" } })
      }
    />
  );
}`;

async function CodeCard({ code, title }: { code: string; title: string }) {
  const html = await codeToHtml(code, {
    lang: "tsx",
    themes: { light: "github-light-default", dark: "github-dark-default" },
    defaultColor: false,
  });
  return (
    <div
      data-slot="hero-code"
      className="overflow-hidden rounded-squircle-2xl rounded-xl border border-border bg-soft-background text-left shadow-sm dark:bg-neutral-900"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-xs text-placeholder-foreground">
          {title}
        </span>
      </div>
      <div
        className="overflow-x-auto p-4 text-[12.5px] leading-6 [&_pre]:m-0 [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col [--docs-max-width:80rem]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,--alpha(var(--color-primary-500)/8%),transparent_60%)]"
          />
          <div className="mx-auto flex w-full max-w-(--docs-max-width) flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 rounded-full px-3 py-1 font-mono"
            >
              <Braces className="size-3.5" />
              Built on TanStack Query v5
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Your API schema is the source of truth
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              use-q turns one schema definition into fully typed, cache-aware
              React hooks — invalidation, optimistic updates, and pagination
              included — without giving up the power of TanStack Query.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-squircle-lg">
                <Link href="/docs/getting-started/quick-start">
                  Quick start <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-squircle-lg"
              >
                <a
                  href="https://github.com/rithviknishad/use-q"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
            <div className="mt-6 font-mono text-sm text-placeholder-foreground">
              pnpm add @use-q/api-client-react @tanstack/react-query
            </div>
          </div>
        </section>

        {/* Code sample */}
        <section className="mx-auto w-full max-w-(--docs-max-width) px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Define once, use everywhere
            </h2>
            <p className="mt-3 text-muted-foreground">
              Describe each route&apos;s method, path, params, body, response,
              and cache tags in a single place. Every hook, query key, and
              invalidation is derived from it.
            </p>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <CodeCard code={heroSnippet} title="api/client.ts" />
            <CodeCard code={usageSnippet} title="PostList.tsx" />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-soft-background">
          <div className="mx-auto w-full max-w-(--docs-max-width) px-6 py-20">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Why use-q?
              </h2>
              <p className="mt-3 text-muted-foreground">
                A thin, opinionated layer over TanStack Query that removes the
                boilerplate of typed API clients — and nothing more.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group rounded-squircle-2xl rounded-xl border border-border bg-card p-5 transition-colors hover:border-strong-border hover:bg-background"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-squircle-lg rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto flex w-full max-w-(--docs-max-width) flex-col items-center px-6 py-20 text-center">
          <BookOpen className="mb-4 size-8 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to dive in?
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Install the packages, define your first schema, and ship a typed
            list-and-create flow in five minutes.
          </p>
          <Button asChild className="mt-6 rounded-squircle-lg">
            <Link href="/docs">
              Read the docs <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-(--docs-max-width) flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-placeholder-foreground">
          <p>
            MIT licensed ·{" "}
            <a
              href="https://github.com/rithviknishad/use-q"
              className="underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              rithviknishad/use-q
            </a>
          </p>
          <p>
            Built on{" "}
            <a
              href="https://tanstack.com/query/latest"
              className="underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              TanStack Query
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
