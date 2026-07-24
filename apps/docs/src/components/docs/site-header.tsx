"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocsSidebarNav } from "@/components/docs/sidebar-nav";
import { ThemeToggle } from "@/components/docs/theme-toggle";

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-squircle-md rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
        q
      </span>
      <span className="font-mono text-sm font-semibold tracking-tight">
        use-q
      </span>
    </Link>
  );
}

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle asChild>
            <div>
              <SiteLogo />
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="px-3 py-4">
          <DocsSidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-(--docs-max-width,90rem) items-center gap-3 px-4 sm:px-6">
        <MobileNav />
        <SiteLogo />
        <div className="flex-1" />
        {children}
        <Button asChild variant="ghost" size="icon" aria-label="GitHub">
          <a
            href="https://github.com/rithviknishad/use-q"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon className="size-4.5" />
          </a>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
