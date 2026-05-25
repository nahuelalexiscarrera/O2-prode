# /_internal

Material de soporte del proceso de desarrollo de **O2 PRODE**.

Esta carpeta **NO** forma parte del build de producción ni se sirve al usuario final.
Sirve como archivo histórico de los assets que originaron el diseño y las decisiones del producto.

---

## Contenido

### `presentation/`
Material entregado o presentado al cliente / stakeholders durante el desarrollo.

- `PRESENTACION_CLIENTE.html` — Presentación inicial del producto al cliente
  (concept, propuesta de valor, mockups guía).

### `concepts/`
Imágenes conceptuales y referencias visuales generadas con IA durante la fase
de exploración. No son assets finales — son inputs creativos del proceso.

- `chatgpt-concept-may-2026.png` — Imagen conceptual generada para guiar
  el estilo visual cinematográfico de la app.

---

## Diferencia con otras carpetas del proyecto

| Carpeta | Propósito | Va al build? |
|---|---|---|
| `app/`, `components/`, `lib/`, `public/`, `types/` | Código de producción | Sí |
| `docs/` | Documentación arquitectónica viva | No (pero versionada) |
| `design/` | Mockups HTML, sprite SVG fuente, tokens | No (pero versionada) |
| `_internal/` | Material histórico de desarrollo | No (archivo) |

---

*Si una pieza ya no aporta contexto histórico ni decisión documentada, se borra.
No es un cajón de sastre.*
