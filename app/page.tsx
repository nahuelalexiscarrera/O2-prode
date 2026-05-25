/**
 * O2 PRODE — Root page
 * Agente 7 · Next.js Architect
 *
 * Middleware redirects unauthenticated users to /login.
 * Authenticated users land on /app (Home Dashboard).
 * This file simply forwards.
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/app");
}
