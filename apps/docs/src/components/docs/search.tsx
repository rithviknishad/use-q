"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Hash, SearchIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { SearchEntry } from "@/lib/docs";

export function DocsSearch({ index }: { index: SearchEntry[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-full max-w-60 justify-start gap-2 rounded-squircle-md bg-soft-background px-2.5 text-sm font-normal text-placeholder-foreground shadow-none sm:w-60"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Search docs…</span>
        <Kbd className="hidden sm:flex">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search use-q docs…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {index.map((entry) => (
              <CommandItem
                key={entry.href}
                value={`${entry.title} ${entry.description ?? ""}`}
                onSelect={() => go(entry.href)}
              >
                <FileText className="size-4 text-placeholder-foreground" />
                <div className="flex flex-col">
                  <span>{entry.title}</span>
                  {entry.description && (
                    <span className="line-clamp-1 text-xs text-placeholder-foreground">
                      {entry.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Sections">
            {index.flatMap((entry) =>
              entry.headings.map((heading) => (
                <CommandItem
                  key={`${entry.href}#${heading.slug}`}
                  value={`${entry.title} ${heading.text}`}
                  onSelect={() => go(`${entry.href}#${heading.slug}`)}
                >
                  <Hash className="size-4 text-placeholder-foreground" />
                  <div className="flex flex-col">
                    <span>{heading.text}</span>
                    <span className="text-xs text-placeholder-foreground">
                      {entry.title}
                    </span>
                  </div>
                </CommandItem>
              )),
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
