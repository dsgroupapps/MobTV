import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

import { getCurrentUser, requireCurrentRole, requireCurrentUser } from "@/lib/auth/session.server";
import { APP_ROLES, getRoleHome } from "@/lib/auth/types";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
});

const roleGuardSchema = z.object({
  roles: z.array(z.enum(APP_ROLES)).min(1),
});

function getAuthErrorMessage(message: string, fallback: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password should be"))
    return "A senha não atende aos requisitos mínimos.";
  if (normalized.includes("rate limit"))
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  return fallback;
}

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  if (!hasServerSupabaseConfig()) return null;
  return getCurrentUser();
});

export const requireUser = createServerFn({ method: "GET" }).handler(() => requireCurrentUser());

export const requireRole = createServerFn({ method: "GET" })
  .validator(roleGuardSchema)
  .handler(({ data }) => requireCurrentRole(data.roles));

export const loginWithPassword = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw new Error(getAuthErrorMessage(error.message, "Não foi possível entrar agora."));
    }

    const user = await getCurrentUser();
    if (!user?.role) {
      await supabase.auth.signOut();
      throw new Error("Sua conta ainda não possui um perfil de acesso válido.");
    }

    return { user, redirectTo: getRoleHome(user.role) };
  });

export const createAccount = createServerFn({ method: "POST" })
  .validator(signupSchema)
  .handler(async ({ data }) => {
    const supabase = createServerSupabaseClient();
    const requestUrl = getRequestUrl({ xForwardedHost: true });
    const emailRedirectTo = new URL("/entrar", requestUrl.origin).toString();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
        emailRedirectTo,
      },
    });

    if (error) {
      throw new Error(
        getAuthErrorMessage(error.message, "Não foi possível criar sua conta agora."),
      );
    }

    return {
      requiresEmailConfirmation: !authData.session,
      redirectTo: authData.session ? "/dashboard" : "/entrar",
    } as const;
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Não foi possível encerrar sua sessão.");
  return { redirectTo: "/entrar" } as const;
});
