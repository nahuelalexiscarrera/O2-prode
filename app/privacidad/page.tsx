import Link from "next/link";
import { PrivacidadContent } from "@/components/features/LegalContent";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Política de privacidad · O2 PRODE" };

// Ruta PÚBLICA (sin login). El registro linkea acá para que un socio nuevo pueda
// leer la política ANTES de aceptarla. La versión logueada vive en
// /app/perfil/privacidad y comparte el mismo contenido (LegalContent).
export default function PrivacidadPublicPage() {
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
          Política de privacidad
        </h1>
      </header>
      <PrivacidadContent />
    </div>
  );
}
