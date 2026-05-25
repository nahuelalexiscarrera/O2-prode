import { ScreenHeader } from "@/components/features/ScreenHeader";

export const metadata = { title: "Términos y condiciones" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <ScreenHeader title="Términos y condiciones" backHref="/app/perfil/configuracion" />

      <div className="flex flex-col gap-6 px-4 pt-4 text-body-sm text-text leading-relaxed">
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">1. Descripción del servicio</h2>
          <p className="text-text-muted">
            O2 PRODE es una competencia de predicciones deportivas exclusiva para socios del
            gimnasio O2, sin costo adicional para el participante. El servicio permite predecir
            resultados de partidos del Mundial 2026 y competir por premios simbólicos definidos
            por el gimnasio y sus marcas aliadas.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">2. Sin dinero ni apuestas</h2>
          <p className="text-text-muted">
            O2 PRODE no involucra dinero real, apuestas, ni ninguna forma de juego de azar
            regulado. Los premios son simbólicos y de carácter recreativo, definidos
            exclusivamente por el gimnasio O2 y sus aliados comerciales.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">3. Elegibilidad</h2>
          <p className="text-text-muted">
            La participación es exclusiva para socios activos del gimnasio O2 que hayan recibido
            un código de invitación. El gimnasio se reserva el derecho de revocar el acceso ante
            conductas contrarias a estos términos.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">4. Conducta en el muro social</h2>
          <p className="text-text-muted">
            El contenido publicado debe ser respetuoso con los demás socios. Queda prohibido
            publicar contenido ofensivo, discriminatorio o contrario a las normas del gimnasio.
            El equipo de O2 puede eliminar contenido inapropiado y suspender cuentas infractoras.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">5. Modificaciones</h2>
          <p className="text-text-muted">
            El gimnasio O2 se reserva el derecho de modificar o discontinuar el servicio en
            cualquier momento, así como ajustar las reglas de puntuación con aviso previo a los
            participantes.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-text">6. Contacto</h2>
          <p className="text-text-muted">
            Ante cualquier consulta podés comunicarte directamente en recepción del gimnasio O2
            o a través de los canales de comunicación habituales del club.
          </p>
        </section>

        <p className="text-[11px] text-text-muted mt-2">Vigente desde junio de 2026.</p>
      </div>
    </div>
  );
}
