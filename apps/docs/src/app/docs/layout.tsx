import { DocsSidebarNav } from "@/components/docs/sidebar-nav";
import { SiteHeader } from "@/components/docs/site-header";
import { DocsSearch } from "@/components/docs/search";
import { getSearchIndex } from "@/lib/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchIndex = getSearchIndex();

  return (
    <div className="flex min-h-dvh flex-col [--docs-max-width:90rem]">
      <SiteHeader>
        <DocsSearch index={searchIndex} />
      </SiteHeader>
      <div className="mx-auto flex w-full max-w-(--docs-max-width) flex-1">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-6 lg:block">
          <DocsSidebarNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
