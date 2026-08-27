import { createStart, createMiddleware } from "@tanstack/react-start";

import { refreshAuthSession } from "./lib/auth/session.server";
import { renderErrorPage } from "./lib/error-page";
import { hasServerSupabaseConfig } from "./lib/supabase/server";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const authSessionMiddleware = createMiddleware().server(async ({ next }) => {
  if (hasServerSupabaseConfig()) {
    await refreshAuthSession();
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, authSessionMiddleware],
}));
