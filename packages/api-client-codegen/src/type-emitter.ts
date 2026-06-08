import type { OpenAPISpec, SchemaObject } from './parser.js';
import { isReference } from './parser.js';

/**
 * Convert an OpenAPI `$ref` like `#/components/schemas/User` to its component
 * name (`"User"`). Returns `null` for non-component refs (rare).
 */
export function refToName(ref: string): string | null {
  const m = ref.match(/^#\/components\/schemas\/(.+)$/);
  return m ? m[1]!.replace(/[^A-Za-z0-9_]/g, '_') : null;
}

/**
 * Convert any OpenAPI schema to a TypeScript type expression. Component refs
 * become their name; everything else recurses to an inline type literal.
 */
export function emitType(schema: SchemaObject | undefined): string {
  if (!schema) return 'unknown';
  if (isReference(schema)) {
    const name = refToName(schema.$ref);
    return name ?? 'unknown';
  }
  const s = schema;

  if (s.allOf?.length) {
    return s.allOf.map((part) => emitType(part)).join(' & ');
  }
  if (s.oneOf?.length || s.anyOf?.length) {
    const parts = (s.oneOf ?? s.anyOf ?? []).map((part) => emitType(part));
    return parts.length ? parts.join(' | ') : 'unknown';
  }
  if (s.enum?.length) {
    return s.enum
      .map((v) => (typeof v === 'string' ? JSON.stringify(v) : v === null ? 'null' : String(v)))
      .join(' | ');
  }
  let type: string;
  switch (s.type) {
    case 'string':
      type = 'string';
      break;
    case 'integer':
    case 'number':
      type = 'number';
      break;
    case 'boolean':
      type = 'boolean';
      break;
    case 'null':
      type = 'null';
      break;
    case 'array':
      type = `Array<${emitType(s.items)}>`;
      break;
    case 'object':
    case undefined: {
      if (s.properties || s.required) {
        const required = new Set(s.required ?? []);
        const props = Object.entries(s.properties ?? {})
          .map(([key, value]) => {
            const optional = required.has(key) ? '' : '?';
            return `${JSON.stringify(key)}${optional}: ${emitType(value)};`;
          })
          .join(' ');
        const extra =
          s.additionalProperties === true
            ? '[key: string]: unknown;'
            : s.additionalProperties && typeof s.additionalProperties === 'object'
              ? `[key: string]: ${emitType(s.additionalProperties)};`
              : '';
        type = `{ ${props}${extra ? ` ${extra}` : ''} }`;
        break;
      }
      if (s.additionalProperties && typeof s.additionalProperties === 'object') {
        type = `Record<string, ${emitType(s.additionalProperties)}>`;
        break;
      }
      type = s.additionalProperties === true ? 'Record<string, unknown>' : 'Record<string, unknown>';
      break;
    }
    default:
      type = 'unknown';
  }
  if (s.nullable) type = `${type} | null`;
  return type;
}

/** Emit a TypeScript module declaring every `components.schemas` entry. */
export function emitTypes(spec: OpenAPISpec): string {
  const schemas = spec.components?.schemas ?? {};
  const lines: string[] = [];
  for (const [name, schema] of Object.entries(schemas)) {
    const safeName = name.replace(/[^A-Za-z0-9_]/g, '_');
    lines.push(`export type ${safeName} = ${emitType(schema)};`);
  }
  return lines.join('\n\n');
}
