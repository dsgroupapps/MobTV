import { ImageIcon, LoaderCircle, Video } from "lucide-react";

import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import { cn } from "@/lib/utils";

export function AssetPreview({
  storagePath,
  type,
  className,
}: {
  storagePath: string | null;
  type: string;
  className?: string;
}) {
  const { signedUrl, loading } = useAssetSignedUrl(storagePath);

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
