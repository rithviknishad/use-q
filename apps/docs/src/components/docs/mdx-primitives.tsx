import Link from "next/link";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  OctagonAlert,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Callout ─────────────────────────────────────────────────────────── */

const calloutStyles = {
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-100 [&_a]:text-blue-700 dark:[&_a]:text-blue-300",
    iconClassName: "text-blue-600 dark:text-blue-400",
  },
  tip: {
    icon: Lightbulb,
    className:
      "border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-100",
    iconClassName: "text-primary-600 dark:text-primary-400",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    icon: OctagonAlert,
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100",
    iconClassName: "text-red-600 dark:text-red-400",
  },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof calloutStyles;
  title?: string;
  children: React.ReactNode;
}) {
  const style = calloutStyles[type];
  const Icon = style.icon;
  return (
    <div
      data-slot="callout"
      className={cn(
        "rounded-squircle-xl rounded-xl border px-4 py-3.5 text-sm leading-6",
        style.className,
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 size-4.5 shrink-0", style.iconClassName)} />
        <div className="min-w-0 flex-1 [&>p]:m-0 [&>p]:text-inherit [&>p+p]:mt-2 [&_code]:bg-black/5 dark:[&_code]:bg-white/10 [&_code]:text-inherit">
          {title && <p className="mb-1 font-semibold">{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Card grid ───────────────────────────────────────────────────────── */

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="card-grid" className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

export function LinkCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children?: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <Link
      data-slot="link-card"
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group rounded-squircle-xl rounded-xl border border-border bg-card p-4 no-underline transition-colors hover:border-strong-border hover:bg-soft-background"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground text-sm">{title}</span>
        <ArrowUpRight className="size-4 shrink-0 text-placeholder-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
      </div>
      {children && (
        <div className="mt-1.5 text-sm leading-6 text-muted-foreground [&>p]:m-0">
          {children}
        </div>
      )}
    </Link>
  );
}

/* ── Steps ───────────────────────────────────────────────────────────── */

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="steps"
      className="[counter-reset:step] ml-4 border-l border-border pl-8 [&>h3]:relative [&>h3]:mt-8 [&>h3:first-child]:mt-0 [&>h3]:[counter-increment:step] [&>h3]:before:absolute [&>h3]:before:-left-[calc(2rem+17px)] [&>h3]:before:top-1/2 [&>h3]:before:-translate-y-1/2 [&>h3]:before:flex [&>h3]:before:size-8 [&>h3]:before:items-center [&>h3]:before:justify-center [&>h3]:before:rounded-full [&>h3]:before:border-4 [&>h3]:before:border-background [&>h3]:before:bg-muted-background [&>h3]:before:text-xs [&>h3]:before:font-semibold [&>h3]:before:text-foreground [&>h3]:before:content-[counter(step)]"
    >
      {children}
    </div>
  );
}
