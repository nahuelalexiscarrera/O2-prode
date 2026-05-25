/**
 * O2 PRODE — Storage setup
 *
 * Creates the post-images Storage bucket (public-read, 5 MB limit).
 * For the comment_count trigger, apply: supabase/migrations/20260524_comment_count_trigger.sql
 *
 * Run: node scripts/setup-db-extras.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

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

async function setupStorageBucket() {
  const BUCKET = "post-images";

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;

  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`✓ bucket '${BUCKET}' ya existe`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  if (error) throw error;
  console.log(`✓ bucket '${BUCKET}' creado (public-read, max 5 MB)`);
}

async function main() {
  console.log("Configurando Storage...\n");
  try {
    await setupStorageBucket();
    console.log("\nBucket listo.");
    console.log("\nPróximo paso: aplicar el trigger de comment_count.");
    console.log("Copiá y ejecutá en el SQL Editor de Supabase Dashboard:");
    console.log("  supabase/migrations/20260524_comment_count_trigger.sql");
  } catch (err) {
    console.error("\nError:", err.message ?? err);
    process.exit(1);
  }
}

main();
