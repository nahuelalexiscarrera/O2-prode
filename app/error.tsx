"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[32px] font-black leading-none tracking-tight text-text">
          Algo salió mal
        </p>
        <p className="text-body-sm text-text-muted max-w-xs">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <button
          onClick={reset}
          className="h-11 rounded-xl bg-primary text-[#0B0B0D] text-body-sm font-semibold"
        >
          Intentar de nuevo
        </button>
        <a
          href="/app"
          className="h-11 rounded-xl border border-border text-body-sm text-text flex items-center justify-center"
        >
          Ir al inicio
        </a>
      </div>

      {/* Detalles técnicos colapsables — útiles durante la beta. */}
      <div className="w-full max-w-md mt-4">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-body-xs text-text-muted underline"
        >
          {showDetails ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}
        </button>
        {showDetails && (
          <pre className="mt-3 text-left text-body-xs bg-surface border border-border rounded-md p-3 overflow-auto max-h-64 whitespace-pre-wrap break-words">
            <span className="text-text-muted">message:</span> {error.message}
            {error.digest && (
              <>
                {"\n"}
                <span className="text-text-muted">digest:</span> {error.digest}
              </>
            )}
            {error.stack && (
              <>
                {"\n\n"}
                <span className="text-text-muted">stack:</span>
                {"\n"}
                {error.stack}
              </>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
