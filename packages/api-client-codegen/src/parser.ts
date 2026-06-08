import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { load as loadYaml } from 'js-yaml';

export interface OpenAPISpec {
  openapi: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, PathItem>;
  components?: { schemas?: Record<string, SchemaObject> };
  [key: string]: unknown;
}

export interface PathItem {
  parameters?: Parameter[];
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  patch?: Operation;
  [key: string]: Operation | Parameter[] | undefined;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
  tags?: string[];
  [key: string]: unknown;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

export interface RequestBody {
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface Response {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema?: SchemaObject;
}

export type SchemaObject =
  | ReferenceObject
  | {
      type?: string;
      format?: string;
      enum?: Array<string | number | boolean | null>;
      properties?: Record<string, SchemaObject>;
      required?: string[];
      items?: SchemaObject;
      additionalProperties?: boolean | SchemaObject;
      allOf?: SchemaObject[];
      oneOf?: SchemaObject[];
      anyOf?: SchemaObject[];
      nullable?: boolean;
      description?: string;
    };

export interface ReferenceObject {
  $ref: string;
}

export function isReference(s: SchemaObject | undefined): s is ReferenceObject {
  return !!s && typeof (s as ReferenceObject).$ref === 'string';
}

/**
 * Thrown by `parseSpec` when the input is missing/unparseable/not OpenAPI 3.x.
 * The CLI catches these and translates them to `process.exit(1)`.
 */
export class CodegenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodegenError';
  }
}

/**
 * Load an OpenAPI 3.x spec from a JSON or YAML file. The format is detected
 * by extension (`.yml`/`.yaml` → YAML, otherwise JSON). Throws `CodegenError`
 * on any failure; the CLI converts that to an exit-1.
 */
export function parseSpec(input: string): OpenAPISpec {
  const path = resolve(input);
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    throw new CodegenError(`could not read spec at ${path}: ${(err as Error).message}`);
  }
  const ext = extname(path).toLowerCase();
  let doc: unknown;
  try {
    if (ext === '.yaml' || ext === '.yml') {
      doc = loadYaml(raw);
    } else {
      doc = JSON.parse(raw);
    }
  } catch (err) {
    throw new CodegenError(`failed to parse ${path}: ${(err as Error).message}`);
  }
  if (!doc || typeof doc !== 'object') {
    throw new CodegenError(`spec at ${path} did not parse to an object`);
  }
  const spec = doc as OpenAPISpec;
  if (typeof spec.openapi !== 'string' || !/^3\./.test(spec.openapi)) {
    throw new CodegenError(
      `unsupported OpenAPI version: expected 3.x, got "${String(spec.openapi)}"`,
    );
  }
  return spec;
}
