import { ScreenHeader } from "@/components/features/ScreenHeader";
import { PrivacidadContent } from "@/components/features/LegalContent";

export const metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <ScreenHeader title="Política de privacidad" backHref="/app/perfil/configuracion" />
      <div className="px-4 pt-4">
        <PrivacidadContent />
      </div>
    </div>
  );
}
