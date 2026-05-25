/**
 * O2 PRODE — Seed Script
 * Inserta los datos del Mundial 2026 en la DB de Supabase.
 *
 * Uso: node scripts/seed.mjs
 *
 * Lee credenciales de .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * Usa la service role key para saltear RLS en tablas de referencia.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

// ─── Load .env.local ──────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, "../.env.local");

function parseEnv(filePath) {
  try {
    return Object.fromEntries(
      readFileSync(filePath, "utf8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const idx = l.indexOf("=");
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
        })
    );
  } catch {
    throw new Error(`No se encontró .env.local en ${filePath}`);
  }
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

// ─── Tournament ───────────────────────────────────────────────────────

const TOURNAMENT_ID = "00000000-0000-0000-0000-000000002026";

async function seedTournament() {
  const { error } = await supabase.from("tournament").upsert(
    {
      id: TOURNAMENT_ID,
      slug: "mundial-2026",
      display_name: "Copa del Mundo FIFA 2026",
      short_name: "Mundial 2026",
      start_date: "2026-06-11",
      end_date: "2026-07-19",
      phase_config: {
        phases: ["groups", "round-of-16", "quarter", "semi", "final"],
        multipliers: { groups: 1, "round-of-16": 2, quarter: 3, semi: 4, final: 5 },
      },
      active: true,
    },
    { onConflict: "slug" }
  );
  if (error) throw error;
  console.log("✓ tournament");
}

// ─── Groups ───────────────────────────────────────────────────────────

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

async function seedGroups() {
  const rows = GROUPS.map((letter) => ({
    id: letter,
    tournament_id: TOURNAMENT_ID,
    letter,
  }));
  const { error } = await supabase.from("groups").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`✓ groups (${rows.length})`);
}

// ─── Teams ────────────────────────────────────────────────────────────

const TEAMS = [
  // Grupo A
  { code: "mx", name: "México",          group_id: "A" },
  { code: "ar", name: "Argentina",       group_id: "A" },
  { code: "jp", name: "Japón",           group_id: "A" },
  { code: "qa", name: "Qatar",           group_id: "A" },
  // Grupo B
  { code: "us", name: "Estados Unidos",  group_id: "B" },
  { code: "br", name: "Brasil",          group_id: "B" },
  { code: "kr", name: "Corea del Sur",   group_id: "B" },
  { code: "ec", name: "Ecuador",         group_id: "B" },
  // Grupo C
  { code: "ca", name: "Canadá",          group_id: "C" },
  { code: "fr", name: "Francia",         group_id: "C" },
  { code: "ng", name: "Nigeria",         group_id: "C" },
  { code: "uy", name: "Uruguay",         group_id: "C" },
  // Grupo D
  { code: "de", name: "Alemania",        group_id: "D" },
  { code: "co", name: "Colombia",        group_id: "D" },
  { code: "sa", name: "Arabia Saudita",  group_id: "D" },
  { code: "se", name: "Suecia",          group_id: "D" },
  // Grupo E
  { code: "es", name: "España",          group_id: "E" },
  { code: "ma", name: "Marruecos",       group_id: "E" },
  { code: "au", name: "Australia",       group_id: "E" },
  { code: "cr", name: "Costa Rica",      group_id: "E" },
  // Grupo F
  { code: "pt", name: "Portugal",        group_id: "F" },
  { code: "ir", name: "Irán",            group_id: "F" },
  { code: "pa", name: "Panamá",          group_id: "F" },
  { code: "be", name: "Bélgica",         group_id: "F" },
  // Grupo G
  { code: "nl", name: "Países Bajos",    group_id: "G" },
  { code: "sn", name: "Senegal",         group_id: "G" },
  { code: "no", name: "Noruega",         group_id: "G" },
  { code: "ws", name: "Gales",           group_id: "G" },
  // Grupo H
  { code: "it", name: "Italia",          group_id: "H" },
  { code: "tn", name: "Túnez",           group_id: "H" },
  { code: "cl", name: "Chile",           group_id: "H" },
  { code: "jm", name: "Jamaica",         group_id: "H" },
  // Grupo I
  { code: "gb", name: "Inglaterra",      group_id: "I" },
  { code: "ck", name: "Rep. Checa",      group_id: "I" },
  { code: "py", name: "Paraguay",        group_id: "I" },
  { code: "tr", name: "Turquía",         group_id: "I" },
  // Grupo J
  { code: "dk", name: "Dinamarca",       group_id: "J" },
  { code: "om", name: "Omán",            group_id: "J" },
  { code: "ci", name: "Costa de Marfil", group_id: "J" },
  { code: "hr", name: "Croacia",         group_id: "J" },
  // Grupo K
  { code: "pl", name: "Polonia",         group_id: "K" },
  { code: "ke", name: "Kenia",           group_id: "K" },
  { code: "ve", name: "Venezuela",       group_id: "K" },
  { code: "nz", name: "Nueva Zelanda",   group_id: "K" },
  // Grupo L
  { code: "ch", name: "Suiza",           group_id: "L" },
  { code: "eg", name: "Egipto",          group_id: "L" },
  { code: "pe", name: "Perú",            group_id: "L" },
  { code: "uz", name: "Uzbekistán",      group_id: "L" },
];

async function seedTeams() {
  const { error } = await supabase
    .from("team")
    .upsert(TEAMS, { onConflict: "code" });
  if (error) throw error;
  console.log(`✓ teams (${TEAMS.length})`);
}

// ─── Matches (group stage) ────────────────────────────────────────────
//
// Patrón round-robin por grupo [T1, T2, T3, T4]:
//   MD1: T1 vs T2,  T3 vs T4
//   MD2: T2 vs T3,  T4 vs T1
//   MD3: T2 vs T4,  T1 vs T3  (simultáneos — mismo kickoff)
//
// Días:
//   MD1: A+G→Jun11 | B+H→Jun12 | C+I→Jun13 | D+J→Jun14 | E+K→Jun15 | F+L→Jun16
//   MD2: A+G→Jun17 | B+H→Jun18 | C+I→Jun19 | D+J→Jun20 | E+K→Jun21 | F+L→Jun22
//   MD3: A+G→Jun23 | B+H→Jun24 | C+I→Jun25 | D+J→Jun26 | E+K→Jun27 | F+L→Jun28
//
// Slots UTC:  Grupos A-F → 16/19:00 (MD1), 19/22:00 (MD2), 19:00 (MD3)
//             Grupos G-L → 20/23:00 (MD1), 20/23:00 (MD2), 22:00 (MD3)

const GROUP_SCHEDULE = {
  A: { teams: ["mx","ar","jp","qa"], md1:"2026-06-11", md2:"2026-06-17", md3:"2026-06-23", slot:"morning", venues: ["Ciudad de México","Guadalajara","Monterrey","Ciudad de México","Guadalajara","Monterrey"] },
  B: { teams: ["us","br","kr","ec"], md1:"2026-06-12", md2:"2026-06-18", md3:"2026-06-24", slot:"morning", venues: ["Los Angeles","Dallas","Los Angeles","Houston","Dallas","Los Angeles"] },
  C: { teams: ["ca","fr","ng","uy"], md1:"2026-06-13", md2:"2026-06-19", md3:"2026-06-25", slot:"morning", venues: ["Toronto","Vancouver","Toronto","Vancouver","Toronto","Vancouver"] },
  D: { teams: ["de","co","sa","se"], md1:"2026-06-14", md2:"2026-06-20", md3:"2026-06-26", slot:"morning", venues: ["Dallas","Atlanta","Houston","Dallas","Dallas","Atlanta"] },
  E: { teams: ["es","ma","au","cr"], md1:"2026-06-15", md2:"2026-06-21", md3:"2026-06-27", slot:"morning", venues: ["Miami","Kansas City","Seattle","Miami","Miami","Kansas City"] },
  F: { teams: ["pt","ir","pa","be"], md1:"2026-06-16", md2:"2026-06-22", md3:"2026-06-28", slot:"morning", venues: ["Boston","Philadelphia","New York","Boston","Philadelphia","New York"] },
  G: { teams: ["nl","sn","no","ws"], md1:"2026-06-11", md2:"2026-06-17", md3:"2026-06-23", slot:"evening", venues: ["Seattle","San Francisco","San Francisco","Los Angeles","Seattle","San Francisco"] },
  H: { teams: ["it","tn","cl","jm"], md1:"2026-06-12", md2:"2026-06-18", md3:"2026-06-24", slot:"evening", venues: ["New York","Philadelphia","Boston","New York","Philadelphia","Boston"] },
  I: { teams: ["gb","ck","py","tr"], md1:"2026-06-13", md2:"2026-06-19", md3:"2026-06-25", slot:"evening", venues: ["Dallas","Kansas City","Houston","Dallas","Kansas City","Houston"] },
  J: { teams: ["dk","om","ci","hr"], md1:"2026-06-14", md2:"2026-06-20", md3:"2026-06-26", slot:"evening", venues: ["Miami","Atlanta","Miami","Atlanta","Miami","Atlanta"] },
  K: { teams: ["pl","ke","ve","nz"], md1:"2026-06-15", md2:"2026-06-21", md3:"2026-06-27", slot:"evening", venues: ["Houston","Kansas City","Kansas City","Houston","Houston","Kansas City"] },
  L: { teams: ["ch","eg","pe","uz"], md1:"2026-06-16", md2:"2026-06-22", md3:"2026-06-28", slot:"evening", venues: ["Guadalajara","Monterrey","Ciudad de México","Guadalajara","Monterrey","Ciudad de México"] },
};

const GROUP_INDEX = { A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9, J:10, K:11, L:12 };
const HEX_CHAR = "0123456789abcdef";

function groupUUID(group, matchNum) {
  // e.g. Group A Match 1 → 00000001-0000-0000-0000-000000000001
  const g = GROUP_INDEX[group].toString(16).padStart(8, "0");
  const m = matchNum.toString(16).padStart(12, "0");
  return `${g}-0000-0000-0000-${m}`;
}

function kickoff(date, hour) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00Z`;
}

function buildGroupMatches(group, cfg) {
  const [t1, t2, t3, t4] = cfg.teams;
  const venues = cfg.venues;
  const isMorning = cfg.slot === "morning";

  // MD1 times UTC:  morning→16/19,  evening→20/23
  const md1t1 = isMorning ? 16 : 20;
  const md1t2 = isMorning ? 19 : 23;
  // MD2 times UTC:  morning→19/22,  evening→20/23
  const md2t1 = isMorning ? 19 : 20;
  const md2t2 = isMorning ? 22 : 23;
  // MD3 times UTC:  morning→19,     evening→22 (both simultaneous)
  const md3t  = isMorning ? 19 : 22;

  return [
    // MD1
    { id: groupUUID(group, 1), home_code: t1, away_code: t2, kickoff_at: kickoff(cfg.md1, md1t1), venue_city: venues[0] },
    { id: groupUUID(group, 2), home_code: t3, away_code: t4, kickoff_at: kickoff(cfg.md1, md1t2), venue_city: venues[1] },
    // MD2
    { id: groupUUID(group, 3), home_code: t2, away_code: t3, kickoff_at: kickoff(cfg.md2, md2t1), venue_city: venues[2] },
    { id: groupUUID(group, 4), home_code: t4, away_code: t1, kickoff_at: kickoff(cfg.md2, md2t2), venue_city: venues[3] },
    // MD3 (simultaneous)
    { id: groupUUID(group, 5), home_code: t2, away_code: t4, kickoff_at: kickoff(cfg.md3, md3t),  venue_city: venues[4] },
    { id: groupUUID(group, 6), home_code: t1, away_code: t3, kickoff_at: kickoff(cfg.md3, md3t),  venue_city: venues[5] },
  ].map((m) => ({
    ...m,
    tournament_id: TOURNAMENT_ID,
    phase: "groups",
    group_id: group,
    status: "scheduled",
  }));
}

async function seedMatches() {
  const rows = Object.entries(GROUP_SCHEDULE).flatMap(([group, cfg]) =>
    buildGroupMatches(group, cfg)
  );

  // Insert in two batches to stay well under Supabase payload limits
  const half = Math.ceil(rows.length / 2);
  for (const batch of [rows.slice(0, half), rows.slice(half)]) {
    const { error } = await supabase.from("match").upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }
  console.log(`✓ matches (${rows.length} — fase de grupos)`);
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Iniciando seed de O2 PRODE — Mundial 2026...\n");
  try {
    await seedTournament();
    await seedGroups();
    await seedTeams();
    await seedMatches();
    console.log("\nSeed completado.");
  } catch (err) {
    console.error("\nError en seed:", err.message ?? err);
    process.exit(1);
  }
}

main();
