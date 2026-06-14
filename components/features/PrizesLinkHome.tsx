"use client";

/**
 * O2 PRODE — Acceso a premios desde Home.
 *
 * Link jerarquizado (dorado + ticket) con pulso continuo sutil para invitar
 * a entrar a /app/premios. La animación sale del catálogo (prizePulse) y se
 * apaga con prefers-reduced-motion. El copy llega por prop desde i18n.
 */

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { prizePulse } from "@/lib/motion/variants";

export function PrizesLinkHome({ label }: { label: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="-mt-2 self-start"
      variants={prizePulse}
      initial="idle"
      animate={reduced ? "idle" : "pulse"}
      style={{ transformOrigin: "left center" }}
    >
      <Link
        href="/app/premios"
        className="inline-flex items-center gap-1.5 text-body-md font-semibold text-[#D4AF37] hover:text-[#E8C14A] transition-colors"
      >
        <Icon name="ticket" size={16} />
        {label}
      </Link>
    </motion.div>
  );
}
