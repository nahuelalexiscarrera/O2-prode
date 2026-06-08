import Link from "next/link";
import { TerminosContent } from "@/components/features/LegalContent";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Términos y condiciones · O2 PRODE" };

// Ruta PÚBLICA (sin login). El registro linkea acá para que un socio nuevo pueda
// leer los términos ANTES de aceptarlos. La versión logueada vive en
// /app/perfil/terminos y comparte el mismo contenido (LegalContent).
export default function TerminosPublicPage() {
  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <header className="mb-8">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-body-sm text-text-muted hover:text-text mb-6"
        >
          <Icon name="arrow-left" size={16} />
          Volver al registro
        </Link>
        <h1 className="font-display text-display-md leading-tight text-text">
          Términos y condiciones
        </h1>
      </header>
      <TerminosContent />
    </div>
  );
}
