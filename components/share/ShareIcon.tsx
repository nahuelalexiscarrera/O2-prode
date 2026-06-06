/**
 * O2 PRODE — Iconos inline para share cards (Satori / @vercel/og)
 *
 * Satori NO soporta <use href="sprite#id"> de un sprite externo, así que para
 * las share PNG inyectamos el path real del sprite (design/icons.svg) inline.
 * Mismo trazo (24x24, stroke-width del sprite) → iconografía custom consistente.
 *
 * El color se aplica EXPLÍCITO en cada elemento (no por herencia ni currentColor)
 * para no depender de cómo Satori resuelve la cascada SVG.
 */

type IconRenderer = (c: string) => React.ReactNode;

/** path con stroke (la mayoría de los íconos del sprite). */
const sp = (c: string, d: string, width = 1.75) => (
  <path
    d={d}
    fill="none"
    stroke={c}
    strokeWidth={width}
    strokeLinecap="square"
    strokeLinejoin="miter"
  />
);

const ICONS: Record<string, IconRenderer> = {
  target: (c) => (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={1.75} />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke={c} strokeWidth={1.75} />
      <circle cx="12" cy="12" r="2" fill={c} />
    </>
  ),
  crown: (c) => (
    <>
      <path d="M3 8 L7 13 L12 6 L17 13 L21 8 L20 19 L4 19 Z" fill={c} />
      <circle cx="3" cy="8" r="1.5" fill={c} />
      <circle cx="21" cy="8" r="1.5" fill={c} />
      <circle cx="12" cy="6" r="1.5" fill={c} />
    </>
  ),
  flame: (c) => (
    <path
      d="M12 3 C12 6 8 9 8 13 C8 16 9.5 19 12 21 C14.5 19 16 16 16 13 C16 12 15.5 11 14.5 10 C14 11 13 12 12 12 C12 9 13 6 12 3 Z"
      fill="none"
      stroke={c}
      strokeWidth={1.75}
      strokeLinejoin="miter"
    />
  ),
  check: (c) => sp(c, "M4 12 L10 18 L20 6", 2.25),
  medal: (c) => (
    <>
      {sp(c, "M7 3 L10 12 L17 12 L14 3 L7 3 Z")}
      <circle cx="12" cy="16" r="5.5" fill="none" stroke={c} strokeWidth={1.75} />
      <path d="M10.5 14.5 L12 16 L13.5 14.5" fill="none" stroke={c} strokeWidth={1.5} />
    </>
  ),
  ball: (c) => (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={1.75} />
      <path
        d="M12 5 L8 8 L9.5 13 L14.5 13 L16 8 Z M8 8 L4 10 M16 8 L20 10 M9.5 13 L7 18 M14.5 13 L17 18"
        fill="none"
        stroke={c}
        strokeWidth={1.5}
      />
    </>
  ),
  clock: (c) => (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={1.75} />
      {sp(c, "M12 7 L12 12 L15.5 14.5")}
    </>
  ),
  comment: (c) => sp(c, "M4 4 L20 4 L20 16 L13 16 L9 20 L9 16 L4 16 Z"),
  heart: (c) =>
    sp(c, "M12 21 L4 13 C2 11 2 7.5 4.5 5.5 C7 3.5 10 4.5 12 7 C14 4.5 17 3.5 19.5 5.5 C22 7.5 22 11 20 13 L12 21 Z"),
  share: (c) => sp(c, "M5 11 L5 21 L19 21 L19 11 M12 16 L12 3 M7 8 L12 3 L17 8"),
  "nav-user": (c) => (
    <>
      <circle cx="12" cy="8" r="4" fill="none" stroke={c} strokeWidth={1.75} />
      {sp(c, "M4 22 C4 17 7.5 15 12 15 C16.5 15 20 17 20 22")}
    </>
  ),
  "nav-chart": (c) => (
    <>
      {sp(c, "M3 21 L21 21 M6 21 L6 14 M12 21 L12 8 M18 21 L18 11")}
      <circle cx="6" cy="14" r="0.8" fill={c} />
      <circle cx="12" cy="8" r="0.8" fill={c} />
      <circle cx="18" cy="11" r="0.8" fill={c} />
    </>
  ),
  "arrow-up": (c) => sp(c, "M6 11 L12 5 L18 11 M12 5 L12 20"),
};

export function ShareIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const render = ICONS[name] ?? ICONS.medal;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "flex" }}
    >
      {render?.(color)}
    </svg>
  );
}
