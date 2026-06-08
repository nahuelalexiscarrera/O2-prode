/**
 * O2 PRODE — Contenido legal compartido (Términos y Privacidad).
 *
 * Fuente ÚNICA de verdad del texto legal. Lo consumen tanto las rutas públicas
 * (/terminos, /privacidad — accesibles sin login desde el registro) como las de
 * perfil (/app/perfil/terminos, .../privacidad — usuario logueado). Así el texto
 * nunca diverge entre ambas vistas.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold text-text">{title}</h2>
      <p className="text-text-muted">{children}</p>
    </section>
  );
}

export function TerminosContent() {
  return (
    <div className="flex flex-col gap-6 text-body-sm text-text leading-relaxed">
      <Section title="1. Descripción del servicio">
        O2 PRODE es una competencia de predicciones deportivas exclusiva para socios del gimnasio
        O2, sin costo adicional para el participante. El servicio permite predecir resultados de
        partidos del Mundial 2026 y competir por premios simbólicos definidos por el gimnasio y sus
        marcas aliadas.
      </Section>
      <Section title="2. Sin dinero ni apuestas">
        O2 PRODE no involucra dinero real, apuestas, ni ninguna forma de juego de azar regulado. Los
        premios son simbólicos y de carácter recreativo, definidos exclusivamente por el gimnasio O2
        y sus aliados comerciales.
      </Section>
      <Section title="3. Elegibilidad">
        La participación es para socios del gimnasio O2. El gimnasio se reserva el derecho de revocar
        el acceso ante conductas contrarias a estos términos.
      </Section>
      <Section title="4. Conducta en el muro social">
        El contenido publicado debe ser respetuoso con los demás socios. Queda prohibido publicar
        contenido ofensivo, discriminatorio o contrario a las normas del gimnasio. El equipo de O2
        puede eliminar contenido inapropiado y suspender cuentas infractoras.
      </Section>
      <Section title="5. Modificaciones">
        El gimnasio O2 se reserva el derecho de modificar o discontinuar el servicio en cualquier
        momento, así como ajustar las reglas de puntuación con aviso previo a los participantes.
      </Section>
      <Section title="6. Contacto">
        Ante cualquier consulta podés comunicarte directamente en recepción del gimnasio O2 o a
        través de los canales de comunicación habituales del club.
      </Section>
      <p className="text-[11px] text-text-muted mt-2">Vigente desde junio de 2026.</p>
    </div>
  );
}

export function PrivacidadContent() {
  return (
    <div className="flex flex-col gap-6 text-body-sm text-text leading-relaxed">
      <Section title="1. Datos que recopilamos">
        Recopilamos únicamente los datos necesarios para operar el servicio: dirección de email,
        nombre para mostrar, predicciones realizadas, publicaciones en el muro social, y preferencias
        de notificación. No recopilamos datos de pago ni información financiera de ningún tipo.
      </Section>
      <Section title="2. Uso de los datos">
        Los datos se utilizan exclusivamente para: mostrar tu posición en el ranking, calcular tus
        puntos, enviarte notificaciones según tus preferencias, y mejorar la experiencia de la
        aplicación. No vendemos ni compartimos datos con terceros fuera del gimnasio O2.
      </Section>
      <Section title="3. Visibilidad de predicciones">
        Por defecto tus predicciones son visibles para otros socios. Podés cambiar esta configuración
        en cualquier momento desde Configuración. El ranking siempre es público para todos los
        participantes.
      </Section>
      <Section title="4. Imágenes subidas">
        Las imágenes que subís al muro son almacenadas de forma segura en Supabase Storage y son
        visibles para los demás socios. Al eliminar un post, la imagen asociada puede permanecer en
        el servidor por un período de hasta 30 días.
      </Section>
      <Section title="5. Retención de datos">
        Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar la eliminación de tu
        cuenta y datos asociados en cualquier momento contactando al gimnasio. El historial de
        predicciones puede conservarse de forma anónima para estadísticas.
      </Section>
      <Section title="6. Seguridad">
        Utilizamos Supabase con Row Level Security (RLS) para garantizar que cada usuario solo accede
        a sus propios datos privados. Las contraseñas nunca se almacenan en texto plano.
      </Section>
      <Section title="7. Contacto">
        Para consultas sobre privacidad o solicitudes de eliminación de datos, contactate en
        recepción del gimnasio O2 o por los canales de comunicación del club.
      </Section>
      <p className="text-[11px] text-text-muted mt-2">Vigente desde junio de 2026.</p>
    </div>
  );
}
