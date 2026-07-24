"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "Copy to clipboard"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:bg-muted-background hover:text-foreground",
        copied && "text-primary hover:text-primary",
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

/** Wraps rehype-pretty-code <pre> blocks with a hover copy button. */
export function MdxPre(props: React.ComponentProps<"pre">) {
  const preRef = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    const text = preRef.current?.innerText ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <pre ref={preRef} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className={cn(
          "absolute right-2.5 top-2.5 rounded-md border border-border bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100",
          copied && "text-primary opacity-100 hover:text-primary",
        )}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
