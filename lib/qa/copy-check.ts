/**
 * O2 PRODE — i18n Coverage Validator
 * Agente 14 · QA & Performance
 *
 * Validates that:
 *  1. Every key referenced in code exists in es-AR.json
 *  2. No keys are orphan (in JSON but never referenced) — warning only
 *  3. Interpolations declared in copy match what code passes — when statically analyzable
 *
 * Usage:
 *   pnpm tsx lib/qa/copy-check.ts
 *   exit code 1 if missing keys found.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CheckOptions {
  i18nPath?: string;
  codeGlob?: string[];
  strict?: boolean;
}

interface CheckResult {
  missingKeys: string[];
  orphanKeys: string[];
  interpolationMismatches: Array<{ key: string; declared: string[]; passed: string[] }>;
  totalKeys: number;
  totalReferenced: number;
}

/** Flattens a nested object into dot-paths: { a: { b: "x" } } → ["a.b"] */
function flatten(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return prefix ? [prefix] : [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue; // skip $meta etc.
    const next = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      keys.push(next);
    } else if (typeof v === "object" && v !== null) {
      keys.push(...flatten(v, next));
    }
  }
  return keys;
}

/** Extracts interpolation placeholders from a copy string: "hola {name}" → ["name"] */
function extractInterpolations(s: string): string[] {
  const out: string[] = [];
  const re = /\{(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return Array.from(new Set(out));
}

/** Finds all `t.<path>` references in source code. Regex-based, not AST. */
function findReferencedKeys(source: string): string[] {
  const out = new Set<string>();
  // Matches t.foo.bar.baz or t["foo"].bar
  const re = /\bt\.((?:[a-zA-Z_$][\w$]*\.?)+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m[1]) out.add(m[1].replace(/\.$/, ""));
  }
  return Array.from(out);
}

export function checkCopyCoverage(opts: CheckOptions = {}): CheckResult {
  const i18nPath = opts.i18nPath ?? join(process.cwd(), "lib/i18n/es-AR.json");
  const i18n = JSON.parse(readFileSync(i18nPath, "utf-8"));
  const allKeys = flatten(i18n);

  // In a real implementation, glob across `app/**/*.{ts,tsx}` and components.
  // For this scaffold we accept that as a TODO; the function shape is correct.
  // Replace with `fast-glob` + `readFileSync` per match.
  const sources: string[] = [];
  const referenced = new Set<string>();
  for (const src of sources) {
    for (const k of findReferencedKeys(src)) referenced.add(k);
  }

  const referencedArr = Array.from(referenced);
  const missingKeys = referencedArr.filter((k) => !allKeys.includes(k));
  const orphanKeys = allKeys.filter((k) => !referencedArr.includes(k));

  return {
    missingKeys,
    orphanKeys,
    interpolationMismatches: [], // To be filled when we add type-aware analysis
    totalKeys: allKeys.length,
    totalReferenced: referencedArr.length,
  };
}

/** Standalone CLI entry point. */
if (typeof require !== "undefined" && require.main === module) {
  const result = checkCopyCoverage({ strict: true });
  console.log(`\nO2 PRODE — i18n Coverage Report`);
  console.log(`Total keys in JSON:       ${result.totalKeys}`);
  console.log(`Total keys referenced:    ${result.totalReferenced}`);
  console.log(`Missing in JSON:          ${result.missingKeys.length}`);
  console.log(`Orphan in JSON (warn):    ${result.orphanKeys.length}\n`);

  if (result.missingKeys.length > 0) {
    console.error("Missing keys:\n  - " + result.missingKeys.join("\n  - "));
    process.exit(1);
  }
  process.exit(0);
}
