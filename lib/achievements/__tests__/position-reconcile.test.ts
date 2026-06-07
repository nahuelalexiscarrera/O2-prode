// @vitest-environment node
/**
 * O2 PRODE — Reconciliación de logros de posición · Test Suite
 *
 * Cubre la lógica PURA de diffPositionAchievements: el corazón del fix de que los
 * logros de posición (P01-P03) dependen del ranking GLOBAL, no de las predicciones
 * de un partido. Tras un settle/resettle se reconcilian para TODOS los socios:
 *   - se otorga a quien cruzó hacia adentro de un umbral,
 *   - se revoca a quien cayó fuera,
 * incluso si NO predijeron el partido que disparó el recálculo.
 *
 * Sin DB, sin side effects.
 */

import { describe, expect, it } from "vitest";
import { type PositionRow, diffPositionAchievements } from "../position-reconcile";

/** Helper: arma el mapa held desde pares [userId, [achIds...]]. */
function held(...entries: Array<[string, string[]]>): Map<string, Set<string>> {
  return new Map(entries.map(([uid, ids]) => [uid, new Set(ids)]));
}

describe("diffPositionAchievements — otorgar al cruzar hacia adentro", () => {
  it("un NO-predictor que pasó de #11 a #10 ahora merece P01", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 10 }];
    const { awards, revokes } = diffPositionAchievements(rows, held());
    expect(awards).toEqual([{ userId: "u1", achievementId: "P01" }]);
    expect(revokes).toEqual([]);
  });

  it("#4 → #3 otorga P02 y mantiene P01 (lo agrega si faltaba)", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 3 }];
    // Ya tenía P01 (estaba top 10); ahora suma P02.
    const { awards, revokes } = diffPositionAchievements(rows, held(["u1", ["P01"]]));
    expect(awards).toEqual([{ userId: "u1", achievementId: "P02" }]);
    expect(revokes).toEqual([]);
  });

  it("salto grande #50 → #1 otorga P01, P02 y P03 de una", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 1 }];
    const { awards, revokes } = diffPositionAchievements(rows, held());
    expect(awards.map((a) => a.achievementId).sort()).toEqual(["P01", "P02", "P03"]);
    expect(revokes).toEqual([]);
  });
});

describe("diffPositionAchievements — revocar al caer fuera", () => {
  it("un NO-predictor que cayó de #10 a #11 pierde P01", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 11 }];
    const { awards, revokes } = diffPositionAchievements(rows, held(["u1", ["P01"]]));
    expect(awards).toEqual([]);
    expect(revokes).toEqual([{ userId: "u1", achievementId: "P01" }]);
  });

  it("perder el #1 (#1 → #2) revoca P03 pero conserva P01 y P02", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 2 }];
    const { awards, revokes } = diffPositionAchievements(rows, held(["u1", ["P01", "P02", "P03"]]));
    expect(awards).toEqual([]);
    expect(revokes).toEqual([{ userId: "u1", achievementId: "P03" }]);
  });

  it("caer del podio al fondo (#3 → #40) revoca P01 y P02", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 40 }];
    const { awards, revokes } = diffPositionAchievements(rows, held(["u1", ["P01", "P02"]]));
    expect(awards).toEqual([]);
    expect(revokes.map((r) => r.achievementId).sort()).toEqual(["P01", "P02"]);
  });

  it("posición 0 (salió del ranking / borrado) revoca todo lo de posición", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 0 }];
    const { awards, revokes } = diffPositionAchievements(rows, held(["u1", ["P01", "P02", "P03"]]));
    expect(awards).toEqual([]);
    expect(revokes.map((r) => r.achievementId).sort()).toEqual(["P01", "P02", "P03"]);
  });
});

describe("diffPositionAchievements — idempotencia / sin doble", () => {
  it("estado ya correcto: ni otorga ni revoca", () => {
    const rows: PositionRow[] = [
      { userId: "leader", position: 1 },
      { userId: "podio", position: 2 },
      { userId: "top10", position: 9 },
      { userId: "fuera", position: 25 },
    ];
    const heldMap = held(
      ["leader", ["P01", "P02", "P03"]],
      ["podio", ["P01", "P02"]],
      ["top10", ["P01"]]
      // "fuera" no tiene nada de posición
    );
    const { awards, revokes } = diffPositionAchievements(rows, heldMap);
    expect(awards).toEqual([]);
    expect(revokes).toEqual([]);
  });

  it("no re-otorga lo que ya está (no double-award)", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 5 }];
    const { awards } = diffPositionAchievements(rows, held(["u1", ["P01"]]));
    expect(awards).toEqual([]);
  });

  it("correr el diff dos veces aplicando el resultado converge (sin oscilar)", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 10 }];
    // 1ra pasada: nada otorgado todavía → otorga P01.
    const first = diffPositionAchievements(rows, held());
    expect(first.awards).toEqual([{ userId: "u1", achievementId: "P01" }]);
    // Aplicamos y reconciliamos de nuevo: ya está, no hay más cambios.
    const second = diffPositionAchievements(rows, held(["u1", ["P01"]]));
    expect(second.awards).toEqual([]);
    expect(second.revokes).toEqual([]);
  });
});

describe("diffPositionAchievements — alcance: solo toca logros de posición", () => {
  it("nunca revoca logros de otros scopes aunque estén en el set held", () => {
    const rows: PositionRow[] = [{ userId: "u1", position: 25 }]; // fuera del top 10
    // El socio tiene logros de skill/social + P01 (que ya no merece).
    const { awards, revokes } = diffPositionAchievements(
      rows,
      held(["u1", ["A01", "S01", "C03", "P01"]])
    );
    expect(awards).toEqual([]);
    // solo P01 se revoca; A01/S01/C03 quedan intactos
    expect(revokes).toEqual([{ userId: "u1", achievementId: "P01" }]);
  });
});

describe("diffPositionAchievements — varios socios en una pasada", () => {
  it("mezcla otorgar a unos y revocar a otros (reshuffle global)", () => {
    const rows: PositionRow[] = [
      { userId: "subio", position: 3 }, // entró al podio
      { userId: "bajo", position: 12 }, // salió del top 10
      { userId: "nuevoLider", position: 1 }, // nuevo #1
      { userId: "exLider", position: 2 }, // perdió el #1
    ];
    const heldMap = held(
      ["subio", ["P01"]], // tenía top 10, le falta P02
      ["bajo", ["P01"]], // ya no merece P01
      ["nuevoLider", ["P01", "P02"]], // le falta P03
      ["exLider", ["P01", "P02", "P03"]] // sobra P03
    );
    const { awards, revokes } = diffPositionAchievements(rows, heldMap);

    expect(awards).toContainEqual({ userId: "subio", achievementId: "P02" });
    expect(awards).toContainEqual({ userId: "nuevoLider", achievementId: "P03" });
    expect(awards).toHaveLength(2);

    expect(revokes).toContainEqual({ userId: "bajo", achievementId: "P01" });
    expect(revokes).toContainEqual({ userId: "exLider", achievementId: "P03" });
    expect(revokes).toHaveLength(2);
  });
});
