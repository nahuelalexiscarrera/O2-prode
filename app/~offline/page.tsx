export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center gap-4">
      <p className="text-[40px] font-black leading-none tracking-tight text-text">
        Sin conexión
      </p>
      <p className="text-body-sm text-text-muted max-w-xs">
        Revisá tu señal y volvé a intentarlo. Tus predicciones guardadas van a seguir ahí.
      </p>
    </div>
  );
}
