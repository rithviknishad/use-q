#!/usr/bin/env node
import { generate } from './index.js';
import { CodegenError } from './parser.js';

function fail(message: string): never {
  console.error(`use-q-codegen: ${message}`);
  process.exit(1);
}

interface CliArgs {
  input?: string | undefined;
  output?: string | undefined;
  baseUrl?: string | undefined;
  help?: boolean;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case '--input':
      case '-i':
        out.input = argv[++i];
        break;
      case '--output':
      case '-o':
        out.output = argv[++i];
        break;
      case '--base-url':
      case '-b':
        out.baseUrl = argv[++i];
        break;
      case '--help':
      case '-h':
        out.help = true;
        break;
      default:
        if (arg.startsWith('--input=')) out.input = arg.slice('--input='.length);
        else if (arg.startsWith('--output=')) out.output = arg.slice('--output='.length);
        else if (arg.startsWith('--base-url=')) out.baseUrl = arg.slice('--base-url='.length);
        else if (!out.input) out.input = arg;
        break;
    }
  }
  return out;
}

const HELP = `use-q-codegen — generate a typed schema.ts from an OpenAPI 3.x spec.

Usage:
  use-q-codegen --input <spec.json|spec.yaml> --output <schema.ts> [--base-url <url>]

Options:
  -i, --input     Path to the OpenAPI spec (JSON or YAML).
  -o, --output    Output TypeScript file. If omitted, prints to stdout.
  -b, --base-url  Optional base URL emitted as \`export const baseUrl\`.
  -h, --help      Show this message.
`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  if (!args.input) fail('missing required --input');

  const source = await generate({
    input: args.input!,
    ...(args.output !== undefined ? { output: args.output } : {}),
    ...(args.baseUrl !== undefined ? { baseUrl: args.baseUrl } : {}),
  });

  if (!args.output) {
    process.stdout.write(source);
  } else {
    console.log(`use-q-codegen: wrote ${args.output}`);
  }
}

main().catch((err: unknown) => {
  if (err instanceof CodegenError) fail(err.message);
  fail((err as Error).message ?? String(err));
});
