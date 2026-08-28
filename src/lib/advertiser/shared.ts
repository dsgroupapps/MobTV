import { redirect } from "@tanstack/react-router";

import { requireCurrentRole } from "@/lib/auth/session.server";

export async function requireAdvertiser() {
  const user = await requireCurrentRole(["advertiser"]);
  if (user.role !== "advertiser") throw redirect({ href: "/admin" });
  return user;
}

export function advertiserDatabaseError(context: string, error: { message: string }): Error {
  console.error(context, error);
  return new Error(`${context}: ${error.message}`);
}
