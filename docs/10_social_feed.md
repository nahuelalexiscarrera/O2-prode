# O2 PRODE — Social Feed Module

**Agente 10 · Social Feed**
Versión 1.0 · 2026-05-19
Inputs: `02_ux_architecture.md` §5 (flow 5), `04_ui_designs.md` §10-§11, `08_data_model.md` §2-§4
Outputs:
- `docs/10_social_feed.md` (este documento)
- `lib/social/queries.ts` (server queries Supabase)
- `lib/social/actions.ts` (server actions: post, react, comment)
- `lib/social/realtime.ts` (subscripciones Realtime)
- `lib/social/feed.ts` (feed builder con paginación)
- Componentes referenciados (no implementados aquí; van en `components/features/`)

---

## 1. Filosofía

El muro NO es Twitter ni Instagram. Es el **vestuario digital de O2** — un círculo cerrado de socios discutiendo el Mundial. Implicaciones:

1. **Cero algoritmo opaco.** Los socios eligen entre "Destacados" (algorítmico simple) y "Recientes" (estricto cronológico inverso). Sin black box.
2. **Optimistic UI obligatorio.** Reacciones y posts aparecen inmediato. La red NO debe sentirse.
3. **Padrón ~800 = volumen moderado.** No es Twitter scale, pero ya no es 32 socios. Diseñar para 50-200 posts/día durante torneo.
4. **Sin threads anidados.** Comentarios planos, 1 nivel (UX-D9 del Agente 2).
5. **Cero ads, cero patrocinados, cero ranking comercial.** La pureza del producto es parte del valor.

---

## 2. Modelo conceptual

```
┌──────────┐                            ┌──────────┐
│   User   │──── posts ───────────────▶ │   Post   │
└──────────┘                            └──────────┘
     │                                       │
     │ reacts to                             │ has many
     │                                       ▼
     │                                  ┌──────────┐
     ▼                                  │ Comment  │
┌──────────┐                            └──────────┘
│ Reaction │                                 ▲
│  (poly)  │─────────────────────────────────┘
└──────────┘ targets post o comment
```

Decisión de modelado (Agente 8): `reaction` es polimórfica vía `target_type` + `target_id`. Permite reaccionar tanto a posts como comments con una sola tabla.

---

## 3. Modos del feed

### 3.1 Recientes (cronológico inverso)

```sql
SELECT * FROM post
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET ?
```

Paginación cursor-based en producción: `LIMIT 20 WHERE created_at < ?cursor` para evitar OFFSET costoso a páginas profundas.

### 3.2 Destacados (algorítmico simple, transparente)

Score por post = `reaction_count + (comment_count × 1.5)` ponderado por recencia. Cap a posts de las últimas 48hs.

```sql
SELECT *,
  (reaction_count + comment_count * 1.5)
  * EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0)
  AS score
FROM post
WHERE deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY score DESC
LIMIT 20
```

Decay exponencial: un post de hace 24h con 10 reacciones queda detrás de uno de hace 2h con 8 reacciones. Justo.

---

## 4. Optimistic UI: reglas

### 4.1 Reacción al post (heart)

```
Usuario taps heart
   │
   ├── [INSTANT] Update local state:
   │     - reactionCount += 1 (o -1 si deselecciona)
   │     - userReacted = true
   │     - Trigger animación M13 (heart pop)
   │
   ├── [PARALELO] POST /api/reactions { targetType: "post", targetId }
   │
   ├── Si server responde 2xx → confirmar (no-op visual)
   │
   └── Si server responde error → revertir + toast "No se pudo guardar tu reacción"
```

**Tiempo desde tap a feedback visual: < 16ms (1 frame).**

### 4.2 Nuevo post

```
Usuario taps "Publicar"
   │
   ├── [INSTANT] El post aparece arriba del feed con visual marker (opacidad 0.7 + spinner pequeño)
   │
   ├── [PARALELO] POST /api/posts { body, embedType, embedRefId }
   │
   ├── Si server responde 2xx → reemplazar el placeholder por el post real (con id del server)
   │
   └── Si server error → mantener el placeholder en estado error + opción "reintentar"
```

### 4.3 Comentario

Idéntico al post pero scope al detalle del post. Compose box queda con texto si falla (no se pierde el typing).

---

## 5. Realtime subscriptions (Supabase)

Tablas suscritas:

| Channel | Pattern | Cuándo se conecta | Cuándo se desconecta |
|---|---|---|---|
| `public:post` | `*` (todos los inserts) | Mount de Wall screen | Unmount |
| `public:reaction:target=<postId>` | filtrado | Hover/scroll cerca del post | Cuando sale del viewport |
| `public:comment:post=<postId>` | filtrado | Mount Post detail | Unmount |

**Reglas de diff:**
- Si llega un INSERT de un post nuevo y estoy en "Recientes" → mostrar banner "1 post nuevo" sticky top, NO insertar automáticamente (evita el "rug pull" mientras leo).
- Si llega un UPDATE de reaction_count del post visible → actualizar in-place, sin animación.
- Si recibo evento de DELETE (soft) de un post que mostraba → fade out + remove.

---

## 6. Queries server (Server Components)

```typescript
// lib/social/queries.ts
import { createClient } from "@/lib/supabase/server";

export async function getFeedRecientes(opts: { limit: number; cursor?: string }) {
  const supabase = await createClient();
  const query = supabase
    .from("post")
    .select(`
      id, user_id, body, embed_type, embed_ref_id,
      reaction_count, comment_count, created_at,
      author:user!user_id ( id, name, initials, avatar_url, level )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit);

  if (opts.cursor) {
    query.lt("created_at", opts.cursor);
  }
  return query;
}

export async function getFeedDestacados() {
  const supabase = await createClient();
  // Uses a SQL view `v_post_destacados` defined in Agente 8 schema
  return supabase
    .from("v_post_destacados")
    .select("*")
    .limit(20);
}

export async function getPostDetail(postId: string) {
  const supabase = await createClient();
  const [post, comments] = await Promise.all([
    supabase.from("post").select(`
      *,
      author:user!user_id ( id, name, initials, avatar_url, level )
    `).eq("id", postId).single(),
    supabase.from("comment").select(`
      *,
      author:user!user_id ( id, name, initials, avatar_url, level )
    `).eq("post_id", postId).is("deleted_at", null).order("created_at"),
  ]);
  return { post, comments };
}
```

---

## 7. Server Actions

```typescript
// lib/social/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const postSchema = z.object({
  body: z.string().min(1).max(280),
  embedType: z.enum(["prediction", "match"]).optional(),
  embedRefId: z.string().uuid().optional(),
});

export async function createPost(input: z.infer<typeof postSchema>) {
  const parsed = postSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No auth");

  const { data, error } = await supabase
    .from("post")
    .insert({
      user_id: user.id,
      body: parsed.body,
      embed_type: parsed.embedType ?? null,
      embed_ref_id: parsed.embedRefId ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateTag("feed-recientes");
  return data;
}

const reactionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
});

export async function toggleReaction(input: z.infer<typeof reactionSchema>) {
  const parsed = reactionSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No auth");

  // Check existing
  const { data: existing } = await supabase
    .from("reaction")
    .select()
    .match({ target_type: parsed.targetType, target_id: parsed.targetId, user_id: user.id })
    .maybeSingle();

  if (existing) {
    await supabase.from("reaction").delete().match({
      target_type: parsed.targetType, target_id: parsed.targetId, user_id: user.id,
    });
    return { reacted: false };
  } else {
    await supabase.from("reaction").insert({
      target_type: parsed.targetType,
      target_id: parsed.targetId,
      user_id: user.id,
    });
    return { reacted: true };
  }
}

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(1).max(280),
});

export async function createComment(input: z.infer<typeof commentSchema>) {
  const parsed = commentSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No auth");

  const { data, error } = await supabase
    .from("comment")
    .insert({
      post_id: parsed.postId,
      user_id: user.id,
      body: parsed.body,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No auth");

  // Soft delete; RLS rechaza si no es el dueño
  const { error } = await supabase
    .from("post")
    .update({ deleted_at: new Date().toISOString() })
    .match({ id: postId, user_id: user.id });

  if (error) throw error;
  revalidateTag("feed-recientes");
}
```

---

## 8. Imágenes en posts (feature MVP, confirmado 2026-05-19)

- 1 imagen opcional por post, max 5MB, formatos JPG/PNG/WebP.
- Storage: bucket Supabase `post-images`, path `{userId}/{postId}.{ext}`.
- Compose box: botón "Adjuntar imagen" + preview + opción de remover antes de publicar.
- Display: imagen renderizada con aspect ratio preservado, max-height 400px, click → lightbox fullscreen.
- 2 casos de uso principales:
  - Socio sube screenshot de su share card cinematográfica.
  - Cliente / marca aliada sube foto promocional de los premios del torneo.
- Validación cliente: tamaño + formato antes de upload.
- Validación server: Edge function valida MIME real (no solo extensión) + redimensiona si > 2000px de ancho.

## 9. Moderación (futuro, no MVP)

- Por ahora confiamos en que el padrón cerrado autorregula. Si aparece toxicidad o spam:
  - Botón "Reportar" en cada post → tabla `report` (futuro).
  - Admin role puede soft-delete cualquier post o quitar imagen.
  - Auto-flag por keyword + análisis de imágenes (Vision API) en post-MVP.

---

## 9. Rate limiting

Para evitar spam:

| Acción | Límite |
|---|---|
| Crear post | 5 por hora |
| Crear comment | 30 por hora |
| Toggle reaction | 60 por minuto (proteger contra accidental clicks repetidos) |

Implementado a nivel edge (Vercel KV) o via Postgres `pg_throttle` extension.

---

## 10. Performance considerations (padrón 800)

- Posts esperados: 50-200/día durante torneo = ~5000-15000 totales.
- Reactions: high volume → batch update vía trigger `trg_reaction_count` ya implementado en Agente 8.
- Feed render: 20 posts por chunk, lazy-load avatars con `loading="lazy"`.
- Realtime: 1 channel global a `public:post` consume bandwidth — cada user mantiene la conexión, pero el server agrega ~800 listeners. Supabase Realtime soporta. Si crece: filter por timestamp recent.
- Embeds (prediction card embebida en post) → fetch perezoso, no en el feed inicial.

---

## 11. Telemetría

| Evento | Cuando |
|---|---|
| `post_created` | Tras createPost success |
| `reaction_toggled` | Tras toggleReaction success |
| `comment_created` | Tras createComment success |
| `wall_opened` | Mount de WallScreen |
| `wall_mode_changed` | Switch Destacados ↔ Recientes |
| `post_shared` | Tap share desde PostCard |

---

## 12. Decisiones cerradas

| # | Decisión | Implicancia |
|---|---|---|
| SF-D1 | Optimistic UI obligatorio en reacciones y posts | Componente recibe `optimisticState` + server action |
| SF-D2 | Recientes = cursor pagination; Destacados = decay exponencial recency-weighted | Vista SQL `v_post_destacados` con la fórmula |
| SF-D3 | Banner "1 post nuevo" en lugar de auto-insert | Evita "rug pull" durante lectura |
| SF-D4 | Rate limits: 5 posts/h, 30 comments/h, 60 reactions/min | Implementación edge |
| SF-D5 | **Imagen opcional en posts** (1 por post, max 5MB, jpg/png/webp). Embeds prediction/match siguen disponibles aparte | Supabase Storage bucket `post-images`. Compose box agrega botón "Adjuntar imagen". 2 casos de uso: screenshot del prode + foto del cliente/marca para premios. |
| SF-D6 | Realtime subscription a public:post global + filtered comments/reactions | ~800 listeners max, dentro de Supabase free tier |
| SF-D7 | Comments sin nesting (1 nivel max) | Simplifica data + UI; reacciones a comments sí |
| SF-D8 | Soft delete via `deleted_at`, no hard delete | Mantiene integridad histórica + posible audit futuro |

---

## 13. Próximo paso

**Agente 11 — Gamification** define triggers de logros que el muro alimenta:
- "Inicio fuerte" (S01) — primer post
- "Popular" (S02) — 10 reacciones en un post
- "Conector" (S04) — 10 comentarios hechos
Y los wiring entre `social/actions` → `gamification/triggers`.

---

*Fin Agente 10 — Listo para checkpoint del usuario.*
