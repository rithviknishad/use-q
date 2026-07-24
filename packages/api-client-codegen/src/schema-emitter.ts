import { resolveConfig as resolvePrettierConfig, format as prettierFormat } from 'prettier';
import type {
  Operation,
  OpenAPISpec,
  Parameter,
  PathItem,
  SchemaObject,
} from './parser.js';
import { isReference } from './parser.js';
import { emitType, emitTypes } from './type-emitter.js';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch'] as const;
type Method = (typeof HTTP_METHODS)[number];

interface RoutePayload {
  routeKey: string;
  method: Method;
  path: string;
  pagination?: { kind: 'page-number' | 'cursor'; pageParam: string } | undefined;
  paramsType: string;
  searchType: string;
  bodyType: string;
  responseType: string;
  tags?: ReadonlyArray<string> | undefined;
}

function uppercaseMethod(m: Method): string {
  return m.toUpperCase();
}

/**
 * Best-effort routeKey from operationId, else `"<METHOD> <path>"`.
 * (The runtime uses the literal route key as a stable map key — both forms
 * work but `operationId` is more ergonomic in user code.)
 */
function routeKeyFor(method: Method, path: string, op: Operation): string {
  if (op.operationId) return op.operationId;
  return `${uppercaseMethod(method)} ${path}`;
}

function collectParameters(item: PathItem, op: Operation): Parameter[] {
  return [...(item.parameters ?? []), ...(op.parameters ?? [])];
}

function emitParamsType(params: Parameter[]): string {
  const path = params.filter((p) => p.in === 'path');
  if (path.length === 0) return 'Record<string, never>';
  const props = path
    .map((p) => {
      const optional = p.required === false ? '?' : '';
      return `${JSON.stringify(p.name)}${optional}: ${emitType(p.schema)};`;
    })
    .join(' ');
  return `{ ${props} }`;
}

function emitSearchType(params: Parameter[]): string {
  const query = params.filter((p) => p.in === 'query');
  if (query.length === 0) return 'Record<string, never>';
  const props = query
    .map((p) => {
      const optional = p.required ? '' : '?';
      return `${JSON.stringify(p.name)}${optional}: ${emitType(p.schema)};`;
    })
    .join(' ');
  return `{ ${props} }`;
}

function emitBodyType(op: Operation): string {
  const body = op.requestBody;
  if (!body) return 'never';
  const json = body.content?.['application/json']?.schema;
  if (!json) return 'unknown';
  return emitType(json);
}

function emitResponseType(op: Operation): string {
  const responses = op.responses ?? {};
  const candidate =
    responses['200'] ?? responses['201'] ?? responses['default'] ?? Object.values(responses)[0];
  if (!candidate) return 'unknown';
  const json = candidate.content?.['application/json']?.schema;
  if (!json) return 'unknown';
  return emitType(json);
}

/**
 * Resolve a `$ref` against the spec's `components/schemas` table. Recurses
 * one level so callers can detect pagination on referenced response types.
 */
function dereference(spec: OpenAPISpec, schema: SchemaObject | undefined): SchemaObject | undefined {
  if (!schema) return undefined;
  if (isReference(schema)) {
    const m = schema.$ref.match(/^#\/components\/schemas\/(.+)$/);
    if (!m) return undefined;
    const target = spec.components?.schemas?.[m[1]!];
    return dereference(spec, target);
  }
  return schema;
}

function detectPagination(
  spec: OpenAPISpec,
  op: Operation,
  params: Parameter[],
): RoutePayload['pagination'] {
  const responseSchema = dereference(spec, op.responses?.['200']?.content?.['application/json']?.schema);
  if (!responseSchema || isReference(responseSchema) || typeof responseSchema === 'undefined') return undefined;
  const props = (responseSchema as { properties?: Record<string, SchemaObject> }).properties ?? {};

  const hasItems = 'items' in props;
  const hasTotal = 'total' in props;
  const hasNextCursor = 'nextCursor' in props || 'next_cursor' in props;

  if (hasItems && hasNextCursor) {
    const cursorParam = params.find((p) => p.in === 'query' && /cursor/i.test(p.name));
    if (cursorParam) return { kind: 'cursor', pageParam: cursorParam.name };
  }
  if (hasItems && hasTotal) {
    const pageParam = params.find(
      (p) => p.in === 'query' && /^(page|pageNumber|page_number)$/i.test(p.name),
    );
    if (pageParam) return { kind: 'page-number', pageParam: pageParam.name };
  }
  return undefined;
}

function buildRoute(
  spec: OpenAPISpec,
  pathStr: string,
  item: PathItem,
  method: Method,
  op: Operation,
): RoutePayload {
  const params = collectParameters(item, op);
  return {
    routeKey: routeKeyFor(method, pathStr, op),
    method,
    path: pathStr,
    pagination: detectPagination(spec, op, params),
    paramsType: emitParamsType(params),
    searchType: emitSearchType(params),
    bodyType: emitBodyType(op),
    responseType: emitResponseType(op),
    tags: op.tags,
  };
}

function serializeRoute(r: RoutePayload): string {
  const lines: string[] = [];
  lines.push('  {');
  lines.push(`    method: ${JSON.stringify(uppercaseMethod(r.method))},`);
  lines.push(`    path: ${JSON.stringify(r.path)},`);
  if (r.tags?.length) {
    lines.push(`    tags: [${r.tags.map((t) => JSON.stringify(t)).join(', ')}] as const,`);
  }
  if (r.pagination) {
    lines.push(
      `    pagination: { kind: ${JSON.stringify(r.pagination.kind)}, pageParam: ${JSON.stringify(
        r.pagination.pageParam,
      )} } as const,`,
    );
  }
  // `as` (not `satisfies`): the phantom generics must survive into the
  // schema object type so RouteResponse/RouteParams inference works for
  // consumers. `satisfies` would erase them.
  lines.push('  } as RouteDefinition<');
  lines.push(`    ${r.paramsType},`);
  lines.push(`    ${r.searchType},`);
  lines.push(`    ${r.bodyType},`);
  lines.push(`    ${r.responseType}`);
  lines.push('  >');
  return lines.join('\n');
}

/** Walk the spec and produce the rendered schema body (pre-format). */
export function buildSchemaModule(spec: OpenAPISpec, options: { baseUrl?: string } = {}): string {
  const routes: RoutePayload[] = [];
  for (const [pathStr, rawItem] of Object.entries(spec.paths ?? {})) {
    if (!rawItem) continue;
    const item = rawItem as PathItem;
    for (const method of HTTP_METHODS) {
      const op = item[method] as Operation | undefined;
      if (!op) continue;
      routes.push(buildRoute(spec, pathStr, item, method, op));
    }
  }

  const header = [
    '// =============================================================================',
    '// AUTO-GENERATED by @use-q/api-client-codegen — DO NOT EDIT BY HAND.',
    '// =============================================================================',
    "import type { RouteDefinition } from '@use-q/api-client';",
    '',
  ];

  if (options.baseUrl) {
    header.push(`export const baseUrl = ${JSON.stringify(options.baseUrl)};`);
    header.push('');
  }

  const types = emitTypes(spec);
  if (types) header.push(types, '');

  const entries = routes
    .map((r) => `  ${JSON.stringify(r.routeKey)}: ${serializeRoute(r).trimStart()},`)
    .join('\n');

  const body = [
    'export const schema = {',
    entries,
    '} as const;',
    '',
    'export type Schema = typeof schema;',
    '',
  ].join('\n');

  return `${header.join('\n')}\n${body}`;
}

/**
 * Build + format the schema module. If `prettierConfigPath` is provided, that
 * config wins; otherwise we fall back to `resolveConfig(outputPath)` so the
 * caller's project Prettier settings are honored when applicable.
 */
export async function emitSchema(
  spec: OpenAPISpec,
  options: { baseUrl?: string; prettierConfigPath?: string; outputPath?: string } = {},
): Promise<string> {
  const raw = buildSchemaModule(spec, { ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}) });
  const config = await resolvePrettierConfig(options.prettierConfigPath ?? options.outputPath ?? '.');
  return prettierFormat(raw, { ...(config ?? {}), parser: 'typescript' });
}
