// @vitest-environment node
/**
 * O2 PRODE — Feed Helpers · Test Suite
 *
 * Pure functions only — no network, no DB.
 */

import { describe, it, expect } from "vitest";
import {
  timeAgo,
  truncateBody,
  groupByDay,
  optimisticPrependPost,
  replacePlaceholder,
  rollbackPlaceholder,
  destacadosScore,
} from "../feed";
import type { Post } from "@/types/domain";

// ─── timeAgo ─────────────────────────────────────────────────────────

describe("timeAgo", () => {
  function ago(ms: number): string {
    const now = new Date("2026-06-01T12:00:00Z");
    const then = new Date(now.getTime() - ms).toISOString();
    return timeAgo(then, now);
  }

  it("menos de 5 segundos → 'ahora'", () => {
    expect(ago(3_000)).toBe("ahora");
  });

  it("5 segundos → 'hace 5s'", () => {
    expect(ago(5_000)).toBe("hace 5s");
  });

  it("59 segundos → 'hace 59s'", () => {
    expect(ago(59_000)).toBe("hace 59s");
  });

  it("60 segundos → 'hace 1 min'", () => {
    expect(ago(60_000)).toBe("hace 1 min");
  });

  it("90 segundos → 'hace 1 min'", () => {
    expect(ago(90_000)).toBe("hace 1 min");
  });

  it("59 minutos → 'hace 59 min'", () => {
    expect(ago(59 * 60_000)).toBe("hace 59 min");
  });

  it("1 hora → 'hace 1h'", () => {
    expect(ago(60 * 60_000)).toBe("hace 1h");
  });

  it("23 horas → 'hace 23h'", () => {
    expect(ago(23 * 3_600_000)).toBe("hace 23h");
  });

  it("1 día → 'hace 1d'", () => {
    expect(ago(24 * 3_600_000)).toBe("hace 1d");
  });

  it("6 días → 'hace 6d'", () => {
    expect(ago(6 * 24 * 3_600_000)).toBe("hace 6d");
  });

  it("7 días → 'hace 1sem'", () => {
    expect(ago(7 * 24 * 3_600_000)).toBe("hace 1sem");
  });

  it("3 semanas → 'hace 3sem'", () => {
    expect(ago(21 * 24 * 3_600_000)).toBe("hace 3sem");
  });

  it("4 semanas o más → fecha absoluta (string no vacío)", () => {
    const result = ago(28 * 24 * 3_600_000);
    // Should NOT be a relative string
    expect(result).not.toMatch(/^hace/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("usa la fecha 'now' recibida como argumento (determinismo)", () => {
    const fixedNow = new Date("2026-06-15T10:00:00Z");
    const then = new Date("2026-06-15T09:00:00Z").toISOString();
    expect(timeAgo(then, fixedNow)).toBe("hace 1h");
  });
});

// ─── truncateBody ────────────────────────────────────────────────────

describe("truncateBody", () => {
  it("devuelve el texto completo si está dentro del límite", () => {
    const text = "Texto corto";
    expect(truncateBody(text, 140)).toBe(text);
  });

  it("devuelve el texto completo si tiene exactamente max caracteres", () => {
    const text = "a".repeat(140);
    expect(truncateBody(text, 140)).toBe(text);
  });

  it("trunca y agrega '…' si supera el límite", () => {
    const text = "a".repeat(141);
    const result = truncateBody(text, 140);
    expect(result).toHaveLength(140);
    expect(result.endsWith("…")).toBe(true);
  });

  it("respeta el límite por defecto de 140", () => {
    const text = "b".repeat(200);
    const result = truncateBody(text);
    expect(result).toHaveLength(140);
  });

  it("elimina espacios finales antes del '…'", () => {
    const text = "hola mundo " + "x".repeat(130);
    const result = truncateBody(text, 15);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/ …$/);
  });
});

// ─── groupByDay ──────────────────────────────────────────────────────

function makePost(id: string, createdAt: string): Post {
  return {
    id,
    userId: "u1",
    body: "texto",
    imageUrl: null,
    imageWidth: null,
    imageHeight: null,
    embedType: null,
    embedRefId: null,
    reactionCount: 0,
    commentCount: 0,
    createdAt,
    deletedAt: null,
  };
}

describe("groupByDay", () => {
  it("retorna vacío con lista vacía", () => {
    expect(groupByDay([])).toEqual([]);
  });

  it("agrupa posts del mismo día", () => {
    const posts = [
      makePost("p1", "2026-06-01T10:00:00Z"),
      makePost("p2", "2026-06-01T18:00:00Z"),
      makePost("p3", "2026-06-02T09:00:00Z"),
    ];
    const groups = groupByDay(posts);
    expect(groups).toHaveLength(2);
    const day1 = groups.find((g) => g.date === "2026-06-01");
    expect(day1?.posts).toHaveLength(2);
  });

  it("un solo post resulta en un solo grupo", () => {
    const posts = [makePost("p1", "2026-06-05T12:00:00Z")];
    const groups = groupByDay(posts);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.date).toBe("2026-06-05");
  });

  it("posts en días distintos producen grupos distintos", () => {
    const posts = [
      makePost("p1", "2026-06-01T00:00:00Z"),
      makePost("p2", "2026-06-02T00:00:00Z"),
      makePost("p3", "2026-06-03T00:00:00Z"),
    ];
    expect(groupByDay(posts)).toHaveLength(3);
  });
});

// ─── Optimistic helpers ───────────────────────────────────────────────

describe("optimisticPrependPost", () => {
  it("inserta el placeholder al inicio", () => {
    const list = [makePost("real-1", "2026-06-01T10:00:00Z")];
    const placeholder = makePost("tmp-abc", "2026-06-01T11:00:00Z");
    const result = optimisticPrependPost(list, placeholder);
    expect(result[0]?.id).toBe("tmp-abc");
    expect(result).toHaveLength(2);
  });

  it("no muta la lista original", () => {
    const list = [makePost("real-1", "2026-06-01T10:00:00Z")];
    const placeholder = makePost("tmp-abc", "2026-06-01T11:00:00Z");
    optimisticPrependPost(list, placeholder);
    expect(list).toHaveLength(1);
  });
});

describe("replacePlaceholder", () => {
  it("reemplaza el item con tempId por el guardado", () => {
    const list = [makePost("tmp-abc", "2026-06-01T11:00:00Z"), makePost("real-1", "2026-06-01T10:00:00Z")];
    const saved = makePost("real-2", "2026-06-01T11:00:00Z");
    const result = replacePlaceholder(list, "tmp-abc", saved);
    expect(result[0]?.id).toBe("real-2");
    expect(result).toHaveLength(2);
  });

  it("no modifica si el tempId no existe", () => {
    const list = [makePost("real-1", "2026-06-01T10:00:00Z")];
    const saved = makePost("real-2", "2026-06-01T11:00:00Z");
    const result = replacePlaceholder(list, "tmp-inexistente", saved);
    expect(result[0]?.id).toBe("real-1");
  });
});

describe("rollbackPlaceholder", () => {
  it("elimina el item con tempId", () => {
    const list = [makePost("tmp-abc", "2026-06-01T11:00:00Z"), makePost("real-1", "2026-06-01T10:00:00Z")];
    const result = rollbackPlaceholder(list, "tmp-abc");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("real-1");
  });

  it("no cambia la lista si el tempId no existe", () => {
    const list = [makePost("real-1", "2026-06-01T10:00:00Z")];
    expect(rollbackPlaceholder(list, "tmp-x")).toHaveLength(1);
  });
});

// ─── destacadosScore ─────────────────────────────────────────────────

describe("destacadosScore", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("post sin reacciones ni comentarios → 0", () => {
    const post = { reactionCount: 0, commentCount: 0, createdAt: "2026-06-01T11:00:00Z" };
    expect(destacadosScore(post, now)).toBe(0);
  });

  it("post reciente tiene mayor score que uno antiguo con iguales métricas", () => {
    const recent = { reactionCount: 10, commentCount: 5, createdAt: "2026-06-01T11:00:00Z" };
    const old = { reactionCount: 10, commentCount: 5, createdAt: "2026-05-25T11:00:00Z" };
    expect(destacadosScore(recent, now)).toBeGreaterThan(destacadosScore(old, now));
  });

  it("comentarios pesan 1.5× más que reacciones", () => {
    const reactions = { reactionCount: 3, commentCount: 0, createdAt: now.toISOString() };
    const comments = { reactionCount: 0, commentCount: 2, createdAt: now.toISOString() };
    // 3 reacciones = score 3, 2 comentarios = score 3 (2 * 1.5)
    expect(destacadosScore(reactions, now)).toBeCloseTo(destacadosScore(comments, now), 5);
  });

  it("decae exponencialmente: 24h después el score es e^-1 del inmediato", () => {
    const justNow = { reactionCount: 10, commentCount: 0, createdAt: now.toISOString() };
    const dayAgo = {
      reactionCount: 10,
      commentCount: 0,
      createdAt: new Date(now.getTime() - 24 * 3_600_000).toISOString(),
    };
    const ratio = destacadosScore(dayAgo, now) / destacadosScore(justNow, now);
    expect(ratio).toBeCloseTo(Math.exp(-1), 5);
  });

  it("usa new Date() como now por defecto (smoke test)", () => {
    const post = { reactionCount: 5, commentCount: 2, createdAt: new Date().toISOString() };
    expect(destacadosScore(post)).toBeGreaterThan(0);
  });
});
