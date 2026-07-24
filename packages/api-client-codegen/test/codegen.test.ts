import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  buildSchemaModule,
  CodegenError,
  emitSchema,
  emitType,
  generate,
  parseSpec,
} from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixtures = resolve(__dirname, 'fixtures');

describe('parseSpec', () => {
  it('loads JSON', () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.json'));
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths).toBeDefined();
  });

  it('loads YAML', () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.yaml'));
    expect(spec.info?.title).toBe('PetstoreYAML');
  });
});

describe('emitType', () => {
  it('resolves $ref to component name', () => {
    expect(emitType({ $ref: '#/components/schemas/User' })).toBe('User');
  });

  it('handles enums', () => {
    expect(emitType({ type: 'string', enum: ['a', 'b'] })).toBe('"a" | "b"');
  });

  it('handles arrays of $ref', () => {
    expect(emitType({ type: 'array', items: { $ref: '#/components/schemas/Pet' } })).toBe(
      'Array<Pet>',
    );
  });

  it('handles allOf as intersection', () => {
    expect(
      emitType({
        allOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
      }),
    ).toBe('A & B');
  });

  it('handles nested objects', () => {
    const t = emitType({
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' }, meta: { type: 'object', properties: { v: { type: 'number' } } } },
    });
    expect(t).toContain('"id": string');
    expect(t).toContain('"meta"?: { "v"?: number; }');
  });
});

describe('buildSchemaModule', () => {
  it('generates a deterministic schema with $ref resolution and pagination', async () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.json'));
    const source = buildSchemaModule(spec, { baseUrl: 'https://api.example.com' });
    expect(source).toContain("export const baseUrl = \"https://api.example.com\"");
    expect(source).toContain('"listPets":');
    expect(source).toContain("method: \"GET\"");
    expect(source).toContain("path: \"/pets\"");
    expect(source).toContain('pagination: { kind: "page-number", pageParam: "page" }');
    expect(source).toContain('pagination: { kind: "cursor", pageParam: "cursor" }');
    expect(source).toContain('export type Schema = typeof schema;');
    expect(source).toContain('as RouteDefinition<');
    expect(source).toContain('export type Pet =');
    expect(source).toContain('export type PetPage =');
  });

  it('matches snapshot via emitSchema (prettier-formatted)', async () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.json'));
    const formatted = await emitSchema(spec, { baseUrl: 'https://api.example.com' });
    expect(formatted).toMatchSnapshot();
  });

  it('detects page-number pagination', async () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.json'));
    const source = buildSchemaModule(spec);
    const idx = source.indexOf('"listPets":');
    expect(idx).toBeGreaterThan(-1);
    const slice = source.slice(idx, idx + 400);
    expect(slice).toContain('pagination: { kind: "page-number", pageParam: "page" }');
  });

  it('detects cursor pagination', async () => {
    const spec = parseSpec(resolve(fixtures, 'petstore.json'));
    const source = buildSchemaModule(spec);
    const idx = source.indexOf('"listEvents":');
    const slice = source.slice(idx, idx + 400);
    expect(slice).toContain('pagination: { kind: "cursor", pageParam: "cursor" }');
  });
});

describe('generate (programmatic)', () => {
  it('returns source for a YAML spec', async () => {
    const source = await generate({ input: resolve(fixtures, 'petstore.yaml') });
    expect(source).toContain('export type Pet =');
    expect(source).toMatch(/listPets:/);
  });
});

describe('invalid spec handling', () => {
  it('throws CodegenError (the CLI translates this to exit 1)', () => {
    expect(() => parseSpec(resolve(fixtures, 'invalid.json'))).toThrowError(CodegenError);
    expect(() => parseSpec(resolve(fixtures, 'invalid.json'))).toThrow(/unsupported OpenAPI version/);
  });

  it('throws CodegenError for missing files', () => {
    expect(() => parseSpec(resolve(fixtures, 'does-not-exist.json'))).toThrowError(CodegenError);
  });
});

describe('cli (built artifact)', () => {
  // Only runs when the package has been built — otherwise skipped to keep the
  // test suite usable in dev. CI runs `pnpm -r build` before `pnpm -r test`.
  const cliPath = resolve(__dirname, '..', 'dist', 'cli.js');
  const cliExists = existsSync(cliPath);

  const runIf = cliExists ? it : it.skip;

  runIf('exits 1 on an invalid spec', async () => {
    const { execFileSync } = await import('node:child_process');
    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [cliPath, '--input', resolve(fixtures, 'invalid.json')], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      const e = err as { status?: number; stderr?: Buffer };
      exitCode = e.status ?? 0;
      stderr = e.stderr?.toString() ?? '';
    }
    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/unsupported OpenAPI version/);
  });

  runIf('writes a schema.ts to disk', async () => {
    const { execFileSync } = await import('node:child_process');
    const { existsSync, mkdtempSync, readFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = mkdtempSync(join(tmpdir(), 'use-q-cli-'));
    const out = join(dir, 'schema.ts');
    try {
      execFileSync(
        'node',
        [cliPath, '--input', resolve(fixtures, 'petstore.json'), '--output', out, '--base-url', 'https://x'],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
      expect(existsSync(out)).toBe(true);
      const written = readFileSync(out, 'utf8');
      expect(written).toContain('export const schema =');
      expect(written).toContain('export type Schema =');
      expect(written).toContain('https://x');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
