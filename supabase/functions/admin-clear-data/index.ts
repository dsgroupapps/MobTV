/* global Deno */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { corsHeaders } from "../_shared/cors.ts";

const CONFIRMATION = "CONFIRMAR EXCLUSÃO";
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const token = authHeader.slice("Bearer ".length);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return jsonResponse({ error: "Forbidden: Admin role required" }, 403);

    const body = await request.json();
    if (body?.confirmation !== CONFIRMATION) {
      return jsonResponse({ error: "Invalid confirmation" }, 400);
    }

    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      entity: "system",
      entity_id: EMPTY_UUID,
      action: "clear_all_data",
      actor_id: user.id,
      before: { timestamp: new Date().toISOString() },
    });
    if (auditError) throw auditError;

    const tables = [
      "opp_logs",
      "moderation_logs",
      "assets",
      "reservations",
      "order_items",
      "quote_items",
      "orders",
      "quotes",
      "slot_locks",
    ] as const;
    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().neq("id", EMPTY_UUID);
      if (error) throw error;
    }

    const { data: files, error: listError } = await supabaseAdmin.storage.from("assets").list();
    if (listError) throw listError;
    if (files && files.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("assets")
        .remove(files.map((file) => file.name));
      if (storageError) throw storageError;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Error in admin-clear-data", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
