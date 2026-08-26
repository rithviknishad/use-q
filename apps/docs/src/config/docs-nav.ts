export type NavItem = {
  title: string;
  href: string;
  badge?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const docsNav: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      {
        title: "Practical React Query",
        href: "/docs/getting-started/practical-react-query",
      },
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
      {
        title: "Schema Definition",
        href: "/docs/getting-started/schema-definition",
      },
    ],
  },
  {
    title: "Core",
    items: [
      { title: "createFetcher", href: "/docs/core/create-fetcher" },
      { title: "Error Handling", href: "/docs/core/error-handling" },
      { title: "OpenAPI Codegen", href: "/docs/core/codegen" },
    ],
  },
  {
    title: "React",
    items: [
      { title: "createApiClient", href: "/docs/react/create-api-client" },
      { title: "useQ", href: "/docs/react/use-q" },
      { title: "useM", href: "/docs/react/use-m" },
      { title: "useInfiniteQ", href: "/docs/react/use-infinite-q" },
      { title: "useSuspenseQ", href: "/docs/react/use-suspense-q" },
      { title: "useQClient", href: "/docs/react/use-q-client" },
      { title: "ApiErrorBoundary", href: "/docs/react/api-error-boundary" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Query Keys", href: "/docs/guides/query-keys" },
      { title: "Tag Invalidation", href: "/docs/guides/tag-invalidation" },
      {
        title: "Optimistic Updates",
        href: "/docs/guides/optimistic-updates",
      },
      {
        title: "Bring Your Own QueryClient",
        href: "/docs/guides/byo-query-client",
      },
      { title: "SSR & Loaders", href: "/docs/guides/ssr-and-loaders" },
      { title: "Monorepo Usage", href: "/docs/guides/monorepo-usage" },
    ],
  },
  {
    title: "API Reference",
    items: [
      {
        title: "RouteDefinition",
        href: "/docs/api-reference/route-definition",
      },
      {
        title: "createFetcher Options",
        href: "/docs/api-reference/create-fetcher-options",
      },
      {
        title: "createApiClient Options",
        href: "/docs/api-reference/create-api-client-options",
      },
    ],
  },
];

export const flatNav: NavItem[] = docsNav.flatMap((group) => group.items);

export function findNeighbours(href: string): {
  prev?: NavItem;
  next?: NavItem;
} {
  const index = flatNav.findIndex((item) => item.href === href);
  if (index === -1) return {};
  return {
    prev: index > 0 ? flatNav[index - 1] : undefined,
    next: index < flatNav.length - 1 ? flatNav[index + 1] : undefined,
  };
}

export function findGroup(href: string): NavGroup | undefined {
  return docsNav.find((group) => group.items.some((i) => i.href === href));
}
