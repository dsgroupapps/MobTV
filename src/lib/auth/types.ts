export const APP_ROLES = ["admin", "operator", "advertiser"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole | null;
  roles: AppRole[];
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.some((role) => role === value);
}

export function getRoleHome(role: AppRole | null): "/dashboard" | "/admin" | "/entrar" {
  if (role === "admin" || role === "operator") return "/admin";
  if (role === "advertiser") return "/dashboard";
  return "/entrar";
}
