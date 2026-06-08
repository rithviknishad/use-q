import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseSpec } from './parser.js';
import { emitSchema } from './schema-emitter.js';

export { CodegenError, parseSpec } from './parser.js';
export type {
  MediaType,
  OpenAPISpec,
  Operation,
  Parameter,
  PathItem,
  ReferenceObject,
  RequestBody,
  Response,
  SchemaObject,
} from './parser.js';
export { isReference } from './parser.js';
export { emitType, emitTypes, refToName } from './type-emitter.js';
export { buildSchemaModule, emitSchema } from './schema-emitter.js';

export interface GenerateOptions {
  input: string;
  output?: string;
  baseUrl?: string;
}

/**
 * Programmatic entry-point: parse the spec, render the schema module, and
 * (optionally) write it to disk. Returns the generated source.
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const spec = parseSpec(options.input);
  const source = await emitSchema(spec, {
    ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}),
    ...(options.output !== undefined ? { outputPath: resolve(options.output) } : {}),
  });
  if (options.output) {
    const out = resolve(options.output);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, source, 'utf8');
  }
  return source;
}
