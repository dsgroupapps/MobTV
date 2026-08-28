import { useEffect, useState } from "react";
import { ImageIcon, LoaderCircle, Video } from "lucide-react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

function normalizeStoragePath(storagePath: string): string {
  if (!storagePath.includes("supabase.co/storage/v1/object/")) return storagePath;
  return storagePath.split("/assets/")[1] ?? storagePath;
}

export function AssetPreview({
  storagePath,
  type,
  className,
}: {
  storagePath: string | null;
  type: string;
  className?: string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(storagePath));

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    let active = true;
    const path = normalizeStoragePath(storagePath);
    const fetchSignedUrl = async () => {
      setLoading(true);
      const { data, error } = await getBrowserSupabaseClient()
        .storage.from("assets")
        .createSignedUrl(path, 3_600);
      if (!active) return;
      setSignedUrl(error ? null : data.signedUrl);
      setLoading(false);
    };

    void fetchSignedUrl();
    const timer = window.setInterval(fetchSignedUrl, 59 * 60 * 1_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [storagePath]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center bg-off-white", className)}>
        <LoaderCircle
          className="h-6 w-6 animate-spin text-ink-soft"
          aria-label="Carregando mídia"
        />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-off-white text-ink-soft", className)}>
        {type.startsWith("image") ? (
          <ImageIcon className="h-10 w-10" aria-label="Imagem indisponível" />
        ) : (
          <Video className="h-10 w-10" aria-label="Vídeo indisponível" />
        )}
      </div>
    );
  }

  if (type.startsWith("image")) {
    return <img src={signedUrl} alt="Prévia da mídia" className={cn("object-cover", className)} />;
  }

  return (
    <video src={signedUrl} controls preload="metadata" className={cn("object-cover", className)}>
      <track kind="captions" />
    </video>
  );
}
