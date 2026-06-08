/**
 * O2 PRODE — Admin Layout (structural guard)
 *
 * ADMIN-001: Toda sub-página bajo /app/admin/* hereda esta verificación.
 * Sin este layout, una nueva página admin sin su propio getIsAdmin() check
 * quedaría accesible para cualquier socio autenticado.
 *
 * El guard corre en el servidor antes de renderizar cualquier child — si falla,
 * nunca se ejecuta el código de la página ni se transfiere data al cliente.
 */

import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/users/queries";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  // getIsAdmin() usa el cliente de sesión del usuario actual.
  // Si no es admin → notFound() (misma respuesta que las páginas individuales).
  if (!(await getIsAdmin())) {
    notFound();
  }

  return <>{children}</>;
}
