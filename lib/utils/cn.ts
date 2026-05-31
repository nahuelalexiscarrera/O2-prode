/**
 * Utility: className builder with Tailwind merge.
 * Combines `clsx` (conditional classes) with `tailwind-merge`
 * (resolves Tailwind conflicts like `px-2 px-4` → `px-4`).
 *
 * El DS define escalas tipográficas propias (`text-display-*`, `text-heading-*`,
 * `text-body-*`, `text-numeric-*`). tailwind-merge no las conoce: al combinarlas
 * con un color de texto en un mismo `cn()` (ej. `cn("text-numeric-xl", "text-text")`)
 * las trataba como clases `text-*` en conflicto y DESCARTABA el tamaño, dejando el
 * número en su tamaño por defecto. Las registramos en el grupo `font-size` para que
 * convivan con los colores sin pisarse.
 */

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display-md",
            "heading-lg",
            "heading-md",
            "heading-sm",
            "body-lg",
            "body-md",
            "body-sm",
            "body-xs",
            "numeric-xl",
            "numeric-lg",
            "numeric-md",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
