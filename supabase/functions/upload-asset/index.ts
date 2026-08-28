/* global Deno */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { corsHeaders } from "../_shared/cors.ts";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_TYPES = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice("Bearer ".length);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const orderItemId = formData.get("orderItemId");

    if (!(file instanceof File) || typeof orderItemId !== "string") {
      return jsonResponse({ error: "File and orderItemId are required" }, 400);
    }

    if (!UUID_PATTERN.test(orderItemId)) {
      return jsonResponse({ error: "Invalid orderItemId" }, 400);
    }

    const { data: ownedOrderItem, error: ownershipError } = await supabaseAdmin
      .from("order_items")
      .select("id,orders!inner(user_id)")
      .eq("id", orderItemId)
      .eq("orders.user_id", user.id)
      .maybeSingle();

    if (ownershipError) {
      console.error("Order item ownership check failed", ownershipError);
      return jsonResponse({ error: "Failed to validate order item" }, 500);
    }

    if (!ownedOrderItem) {
      return jsonResponse({ error: "Order item not found or access denied" }, 403);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: "File too large. Maximum 50MB allowed." }, 413);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse(
        { error: "Invalid file type. Only MP4, MOV, AVI, JPG, and PNG allowed." },
        400,
      );
    }

    const fileName = `${user.id}/${orderItemId}_${Date.now()}.${FILE_EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("assets")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error", uploadError);
      return jsonResponse({ error: "Failed to upload file" }, 500);
    }

    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("assets")
      .createSignedUrl(fileName, 86_400);
    const asset = {
      order_item_id: orderItemId,
      user_id: user.id,
      type: ALLOWED_VIDEO_TYPES.includes(file.type) ? "video" : "image",
      width: 1920,
      height: 1080,
      duration_seconds: 15,
      status: "pending" as const,
      storage_url: fileName,
    };
    const { data: assetData, error: assetError } = await supabaseAdmin
      .from("assets")
      .insert(asset)
      .select()
      .single();

    if (assetError) {
      console.error("Asset creation error", assetError);
      await supabaseAdmin.storage.from("assets").remove([fileName]);
      return jsonResponse({ error: "Failed to create asset record" }, 500);
    }

    return jsonResponse({
      success: true,
      asset: assetData,
      signedUrl: signedUrlData?.signedUrl ?? "",
    });
  } catch (error) {
    console.error("Error in upload-asset", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
