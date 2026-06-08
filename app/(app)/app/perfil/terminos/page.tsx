import { ScreenHeader } from "@/components/features/ScreenHeader";
import { TerminosContent } from "@/components/features/LegalContent";

export const metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <ScreenHeader title="Términos y condiciones" backHref="/app/perfil/configuracion" />
      <div className="px-4 pt-4">
        <TerminosContent />
      </div>
    </div>
  );
}
