import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import {
  Callout,
  CardGrid,
  LinkCard,
  Steps,
} from "@/components/docs/mdx-primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MdxPre } from "@/components/docs/copy-button";

const components = {
  pre: MdxPre,
  Callout,
  CardGrid,
  LinkCard,
  Steps,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypePrettyCode,
              {
                theme: {
                  light: "github-light-default",
                  dark: "github-dark-default",
                },
                keepBackground: false,
                defaultLang: "plaintext",
              },
            ],
          ],
        },
      }}
    />
  );
}
