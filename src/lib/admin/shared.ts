import { requireCurrentRole } from "@/lib/auth/session.server";

export async function requireAdminArea() {
  return requireCurrentRole(["admin", "operator"]);
}

export async function requireAdminMutation() {
  const user = await requireCurrentRole(["admin", "operator"]);
  if (!user.roles.includes("admin")) {
    throw new Error("Esta ação exige o perfil administrador.");
  }
  return user;
}

export function adminDatabaseError(context: string, error: { message: string }): Error {
  console.error(context, error);
  return new Error(`${context}: ${error.message}`);
}
