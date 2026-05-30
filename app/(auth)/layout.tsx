/**
 * O2 PRODE — (auth) route group layout
 * Login, Register, Forgot, Onboarding. No bottom nav.
 * Fondo de marca (imagen 2) detrás de todas las pantallas de auth.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div aria-hidden className="auth-hero" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
