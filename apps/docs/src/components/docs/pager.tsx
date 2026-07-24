import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { findNeighbours } from "@/config/docs-nav";

export function DocsPager({ href }: { href: string }) {
  const { prev, next } = findNeighbours(href);
  if (!prev && !next) return null;

  return (
    <div className="mt-12 flex items-stretch gap-4 border-t border-border pt-6">
      {prev && (
        <Link
          href={prev.href}
          className="group flex flex-1 flex-col gap-1 rounded-squircle-xl rounded-xl border border-border p-4 transition-colors hover:border-strong-border hover:bg-soft-background"
        >
          <span className="flex items-center gap-1 text-xs text-placeholder-foreground">
            <ChevronLeft className="size-3.5" /> Previous
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">
            {prev.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={next.href}
          className="group flex flex-1 flex-col items-end gap-1 rounded-squircle-xl rounded-xl border border-border p-4 text-right transition-colors hover:border-strong-border hover:bg-soft-background"
        >
          <span className="flex items-center gap-1 text-xs text-placeholder-foreground">
            Next <ChevronRight className="size-3.5" />
          </span>
          <span className="text-sm font-medium text-foreground group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      )}
    </div>
  );
}
