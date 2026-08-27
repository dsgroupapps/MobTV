import "@tanstack/react-start/server-only";

import { redirect } from "@tanstack/react-router";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRoleHome, isAppRole, type AppRole, type AuthUser } from "./types";

const ROLE_PRIORITY: Record<AppRole, number> = {
  admin: 3,
  operator: 2,
  advertiser: 1,
};

export async function refreshAuthSession(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.auth.getUser();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? [])
    .map(({ role }) => role)
    .filter(isAppRole)
    .sort((a, b) => ROLE_PRIORITY[b] - ROLE_PRIORITY[a]);

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Usuário",
    role: roles[0] ?? null,
    roles,
  };
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw redirect({ href: "/entrar" });
  return user;
}

export async function requireCurrentRole(allowedRoles: readonly AppRole[]): Promise<AuthUser> {
  const user = await requireCurrentUser();
  if (!user.roles.some((role) => allowedRoles.includes(role))) {
    throw redirect({ href: getRoleHome(user.role) });
  }
  return user;
}
