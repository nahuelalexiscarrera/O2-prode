/**
 * O2 PRODE — Seed Invites (Sprint 8 · Beta cerrada)
 *
 * Inserta invite codes en la tabla `invite_code` para los socios beta.
 *
 * Uso:
 *   node scripts/seed-invites.mjs
 *
 * Input:
 *   data/seed/beta-testers.json  ← editado por vos (template en .example.json)
 *
 * Schema relevante (supabase/schema.sql):
 *   invite_code(code TEXT PK, created_by UUID?, used BOOL, used_by UUID?, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ)
 *
 * Nota: la tabla NO guarda el email del beta tester. La asociación entre
 * código y persona la mantenés vos por fuera (en el JSON local + tu WhatsApp).
 * Al final del script imprime una tabla code → label para que la guardes.
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local ──────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, "../.env.local");

function parseEnv(filePath) {
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
}

const env = parseEnv(envPath);
const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Read input ───────────────────────────────────────────────────────

const inputPath = join(__dir, "../data/seed/beta-testers.json");
const examplePath = join(__dir, "../data/seed/beta-testers.example.json");

if (!existsSync(inputPath)) {
  console.error(
    "\nNo encontré data/seed/beta-testers.json.\n" +
      "Copiá el template:\n" +
      "  cp data/seed/beta-testers.example.json data/seed/beta-testers.json\n" +
      "Editalo con los 5-10 socios reales y volvé a correr este script.\n"
  );
  process.exit(1);
}

const input = JSON.parse(readFileSync(inputPath, "utf8"));
const testers = input.testers ?? [];
const expiresAt = input.expiresAt ?? "2026-07-26T23:59:59-03:00";

if (testers.length === 0) {
  console.error("data/seed/beta-testers.json no tiene 'testers'. Abortando.");
  process.exit(1);
}

// ─── Validate ─────────────────────────────────────────────────────────

const codeRegex = /^[A-Z0-9-]{3,32}$/;
const seenCodes = new Set();

for (const t of testers) {
  if (!t.code || !codeRegex.test(t.code)) {
    console.error(`Código inválido: ${JSON.stringify(t)}. Debe matchear ${codeRegex}.`);
    process.exit(1);
  }
  if (seenCodes.has(t.code)) {
    console.error(`Código duplicado en JSON: ${t.code}`);
    process.exit(1);
  }
  seenCodes.add(t.code);
}

// ─── Seed ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`Sembrando ${testers.length} invite codes para la beta...\n`);

  const rows = testers.map((t) => ({
    code: t.code,
    used: false,
    expires_at: new Date(expiresAt).toISOString(),
  }));

  const { error } = await supabase
    .from("invite_code")
    .upsert(rows, { onConflict: "code" });

  if (error) {
    console.error("\nError al insertar invite codes:", error.message);
    process.exit(1);
  }

  console.log(`✓ ${rows.length} invite codes insertados/actualizados.\n`);
  console.log("Mapeo code → label (guardalo para tu referencia):\n");
  console.log("  CÓDIGO     │ LABEL");
  console.log("  ───────────┼──────────────────────────────────────────────");
  for (const t of testers) {
    const code = t.code.padEnd(10, " ");
    const label = t.label ?? "(sin label)";
    console.log(`  ${code} │ ${label}`);
  }
  console.log("");
  console.log(`Expiración: ${expiresAt}`);
  console.log("");
  console.log("Próximo paso: enviar cada código al socio correspondiente (ver SPRINT_8_BETA.md §2).");
}

main().catch((err) => {
  console.error("\nError fatal:", err.message ?? err);
  process.exit(1);
});
