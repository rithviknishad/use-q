"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "@/config/docs-nav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DocsSidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {docsNav.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-placeholder-foreground">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-squircle-md rounded-lg px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary-100 font-medium text-primary-900 dark:bg-primary-950 dark:text-primary-200"
                        : "text-muted-foreground hover:bg-muted-background hover:text-foreground",
                    )}
                  >
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
