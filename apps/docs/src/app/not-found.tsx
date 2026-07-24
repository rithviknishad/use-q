import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/docs/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-sm text-placeholder-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Button asChild className="mt-2 rounded-squircle-lg">
          <Link href="/docs">Browse the docs</Link>
        </Button>
      </main>
    </div>
  );
}
