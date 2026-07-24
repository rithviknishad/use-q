# use-q docs

Documentation site for [use-q](https://github.com/rithviknishad/use-q), served at
[use-q.dev](https://use-q.dev).

Built with [Next.js](https://nextjs.org) (App Router, static export),
[shadcn/ui](https://ui.shadcn.com) (`radix-vega` style), and Tailwind CSS v4 —
themed to match [careui.ohc.network](https://careui.ohc.network)
(Figtree + Geist Mono, emerald primary).

## Development

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # static export to out/
```

## Project layout

```
content/docs/            MDX documentation pages (the content)
src/config/docs-nav.ts   Sidebar navigation / page ordering (feeds search & pagers)
src/components/docs/     Docs UI (sidebar, TOC, search, MDX components)
src/components/ui/       shadcn/ui primitives
src/app/                 Landing page + docs layout / catch-all MDX renderer
```

## Authoring

- Pages are MDX files under `content/docs/` with `title`/`description` frontmatter.
- Register new pages in `src/config/docs-nav.ts` so they appear in the sidebar,
  search, and prev/next pagers.
- Components available in MDX without imports: `Callout`, `CardGrid`,
  `LinkCard`, `Steps`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Badge`.

## Deployment

Deployed to Cloudflare Pages via `wrangler.toml` — build outputs a fully static
site to `out/`.
