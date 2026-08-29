import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdminMutation } from "./shared";

export const SYSTEM_CLEAR_CONFIRMATION = "CONFIRMAR EXCLUSÃO";

const clearSystemSchema = z.object({
  confirmation: z.literal(SYSTEM_CLEAR_CONFIRMATION),
  acknowledged: z.literal(true),
});

export const clearAdminSystemData = createServerFn({ method: "POST" })
  .validator(clearSystemSchema)
  .handler(async ({ data }) => {
    await requireAdminMutation();
    const { data: result, error } = await createServerSupabaseClient().functions.invoke(
      "admin-clear-data",
      { body: { confirmation: data.confirmation } },
    );
    if (error) {
      console.error("Erro ao chamar admin-clear-data", error);
      throw new Error("A limpeza não pôde ser executada pela função administrativa.");
    }
    if (!result?.success) throw new Error("A função administrativa não confirmou a limpeza.");
    return { success: true } as const;
  });
