import { useEffect, useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { normalizeAssetStoragePath } from "@/lib/supabase/storage";

export function useAssetSignedUrl(storagePath: string | null, expiresIn = 3_600) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(storagePath));

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    let active = true;
    const path = normalizeAssetStoragePath(storagePath);
    const fetchSignedUrl = async () => {
      setLoading(true);
      const { data, error } = await getBrowserSupabaseClient()
        .storage.from("assets")
        .createSignedUrl(path, expiresIn);
      if (!active) return;
      setSignedUrl(error ? null : data.signedUrl);
      setLoading(false);
    };

    void fetchSignedUrl();
    const refreshAfter = Math.max(60, expiresIn - 60) * 1_000;
    const timer = window.setInterval(fetchSignedUrl, refreshAfter);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [expiresIn, storagePath]);

  return { signedUrl, loading };
}
