"use client";

/**
 * O2 PRODE — Matches · Realtime (client-only)
 *
 * Score en vivo del partido del home. El cron sync-results (cada 2 min) escribe
 * match.live_home_score / live_away_score mientras el partido está IN_PLAY; acá
 * nos suscribimos al UPDATE de esa fila para refrescar el marcador sin reload.
 * Requiere `match` en la publicación supabase_realtime (20260612_match_live_scores).
 *
 * postgres_changes NO repone eventos perdidos: si el websocket se cae (PWA en
 * background, pantalla apagada), los UPDATE de ese lapso se pierden. Por eso,
 * al volver la pestaña a visible re-leemos la fila una vez (refetch barato).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MatchLiveState {
  status: string;
  liveHome: number | null;
  liveAway: number | null;
}

export function useMatchLive(matchId: string, initial: MatchLiveState): MatchLiveState {
  const [state, setState] = useState<MatchLiveState>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`match-${matchId}-live`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match", filter: `id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as {
            status: string;
            live_home_score: number | null;
            live_away_score: number | null;
          };
          setState({
            status: row.status,
            liveHome: row.live_home_score,
            liveAway: row.live_away_score,
          });
        }
      )
      .subscribe();

    // Reconciliación al volver a foreground: el socket pudo perder eventos.
    async function refetch() {
      const { data } = await supabase
        .from("match")
        .select("status, live_home_score, live_away_score")
        .eq("id", matchId)
        .maybeSingle();
      if (data) {
        setState({
          status: data.status as string,
          liveHome: data.live_home_score as number | null,
          liveAway: data.live_away_score as number | null,
        });
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") void refetch();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      channel.unsubscribe();
    };
  }, [matchId]);

  return state;
}
