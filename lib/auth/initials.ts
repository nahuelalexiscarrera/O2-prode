/**
 * Deriva iniciales de un nombre completo.
 * "Juan Pérez" → "JP", "Maria" → "MA", "Ana Maria Lopez" → "AL"
 */
export function deriveInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);
  return (first + last).toUpperCase();
}
