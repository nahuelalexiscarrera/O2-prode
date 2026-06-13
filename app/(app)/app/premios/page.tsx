import { getCurrentPhase } from "@/lib/matches/queries";
import { PremiosScreen } from "@/components/features/PremiosScreen";
import type { Phase } from "@/types/domain";

const PHASE_INDEX: Record<Phase, number> = {
  groups:       0,
  "round-of-32": 0,
  "round-of-16": 1,
  quarter:      2,
  semi:         3,
  final:        4,
};

export default async function PremiosPage() {
  const phase = await getCurrentPhase();
  return <PremiosScreen activePhaseIndex={PHASE_INDEX[phase] ?? 0} />;
}
