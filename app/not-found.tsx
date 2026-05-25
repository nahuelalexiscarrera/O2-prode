import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[64px] font-black leading-none tracking-tight text-primary">
          404
        </p>
        <p className="text-body-sm text-text-muted">Esta página no existe.</p>
      </div>
      <Link
        href="/app"
        className="h-11 px-6 rounded-xl bg-primary text-[#0B0B0D] text-body-sm font-semibold flex items-center justify-center"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
