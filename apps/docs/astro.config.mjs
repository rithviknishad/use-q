import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://use-q.dev",
  integrations: [
    starlight({
      title: "use-q",
      description:
        "Type-safe API client for TypeScript and React, built on TanStack Query v5.",
      logo: {
        light: "./public/logo-light.svg",
        dark: "./public/logo-dark.svg",
        alt: "use-q",
      },
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/rithviknishad/use-q",
        },
      ],
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#0a0a0a" },
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Core",
          autogenerate: { directory: "core" },
        },
        {
          label: "React",
          autogenerate: { directory: "react" },
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "API Reference",
          autogenerate: { directory: "api-reference" },
        },
      ],
    }),
  ],
});
