/**
 * O2 PRODE — (auth) route group layout
 * Login, Register, Forgot, Onboarding. No bottom nav.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell">{children}</div>;
}
