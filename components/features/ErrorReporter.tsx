"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/client";

/**
 * Escucha errores globales del browser (excepciones y promesas rechazadas) y los
 * manda a la auto-captura. No renderiza nada. Va montado una vez en el layout.
 */
export function ErrorReporter() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      reportClientError(e.message || e.error?.message || "Error", e.error?.stack);
    }
    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason as { message?: string; stack?: string } | string | undefined;
      const message = typeof reason === "string" ? reason : reason?.message || "Unhandled rejection";
      const stack = typeof reason === "string" ? undefined : reason?.stack;
      reportClientError(message, stack);
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
