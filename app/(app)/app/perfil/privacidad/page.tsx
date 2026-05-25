import { ScreenHeader } from "@/components/features/ScreenHeader";

export const metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <ScreenHeader title="Política de privacidad" backHref="/app/perfil/configuracion" />

      <div className="flex flex-col gap-6 px-4 pt-4 text-body-sm text-text leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">1. Datos que recopilamos</h2>
          <p className="text-text-muted">
            Recopilamos únicamente los datos necesarios para operar el servicio: dirección de
            email, nombre para mostrar, predicciones realizadas, publicaciones en el muro social,
            y preferencias de notificación. No recopilamos datos de pago ni información
            financiera de ningún tipo.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">2. Uso de los datos</h2>
          <p className="text-text-muted">
            Los datos se utilizan exclusivamente para: mostrar tu posición en el ranking,
            calcular tus puntos, enviarte notificaciones según tus preferencias, y mejorar la
            experiencia de la aplicación. No vendemos ni compartimos datos con terceros fuera
            del gimnasio O2.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">3. Visibilidad de predicciones</h2>
          <p className="text-text-muted">
            Por defecto tus predicciones son visibles para otros socios. Podés cambiar esta
            configuración en cualquier momento desde Configuración. El ranking siempre es
            público para todos los participantes.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">4. Imágenes subidas</h2>
          <p className="text-text-muted">
            Las imágenes que subís al muro son almacenadas de forma segura en Supabase Storage
            y son visibles para los demás socios. Al eliminar un post, la imagen asociada puede
            permanecer en el servidor por un período de hasta 30 días.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">5. Retención de datos</h2>
          <p className="text-text-muted">
            Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar la eliminación
            de tu cuenta y datos asociados en cualquier momento contactando al gimnasio. El
            historial de predicciones puede conservarse de forma anónima para estadísticas.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">6. Seguridad</h2>
          <p className="text-text-muted">
            Utilizamos Supabase con Row Level Security (RLS) para garantizar que cada usuario
            solo accede a sus propios datos privados. Las contraseñas nunca se almacenan en
            texto plano.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">7. Contacto</h2>
          <p className="text-text-muted">
            Para consultas sobre privacidad o solicitudes de eliminación de datos, contactate
            en recepción del gimnasio O2 o por los canales de comunicación del club.
          </p>
        </section>

        <p className="text-[11px] text-text-muted mt-2">Vigente desde junio de 2026.</p>
      </div>
    </div>
  );
}
