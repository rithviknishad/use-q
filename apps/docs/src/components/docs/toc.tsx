"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DocHeading } from "@/lib/docs";

export function TableOfContents({ headings }: { headings: DocHeading[] }) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0% -70% 0%" },
    );
    for (const heading of headings) {
      const el = document.getElementById(heading.slug);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <div className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-placeholder-foreground">
        On this page
      </p>
      <ul className="flex flex-col gap-1 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.slug}>
            <a
              href={`#${heading.slug}`}
              className={cn(
                "-ml-px block border-l py-1 transition-colors",
                heading.level === 2 ? "pl-4" : "pl-7",
                activeId === heading.slug
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
