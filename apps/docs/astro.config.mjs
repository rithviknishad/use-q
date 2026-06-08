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
        src: "./public/favicon.svg",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/rithviknishad/use-q",
        },
      ],
      customCss: ["./src/styles/custom.css"],
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
