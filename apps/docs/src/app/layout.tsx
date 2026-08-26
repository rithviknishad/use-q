import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://use-q.dev"),
  title: {
    default: "use-q — Opinionated TanStack Query for TypeScript and React",
    template: "%s · use-q",
  },
  description:
    "An opinionated, schema-driven way to use TanStack Query v5 — TkDodo's Practical React Query patterns as a typed API client.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "use-q",
    url: "/",
    title: "use-q — Opinionated TanStack Query for TypeScript and React",
    description:
      "An opinionated, schema-driven way to use TanStack Query v5 — TkDodo's Practical React Query patterns as a typed API client.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "use-q — Opinionated TanStack Query for TypeScript and React",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

const llmDiscovery = (
  <>
    <link rel="describedby" href="/llms.txt" />
    <link
      rel="alternate"
      type="text/markdown"
      href="/llms-full.txt"
      title="Complete documentation for LLMs"
    />
  </>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{llmDiscovery}</head>
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
