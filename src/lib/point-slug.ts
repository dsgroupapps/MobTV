import { networkPoints, type Category, type NetworkPoint } from "@/data/network-points";

/**
 * Slug determinístico gerado a partir do nome do ponto — não é um campo novo
 * em network-points.ts (que continua a única fonte de nome/categoria/mídia/
 * foto/localização). Isso evita duplicar dado só para ter uma URL.
 */
export function slugifyPointName(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas diacríticas combinantes pós-NFD)
    .replace(/["']/g, "") // aspas de nomes como Terminal Setor "O"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PointWithCategory = { point: NetworkPoint; category: Category };

let slugIndex: Map<string, PointWithCategory> | null = null;

function getSlugIndex(): Map<string, PointWithCategory> {
  if (slugIndex) return slugIndex;
  slugIndex = new Map();
  for (const category of networkPoints) {
    for (const point of category.points) {
      slugIndex.set(slugifyPointName(point.nome), { point, category });
    }
  }
  return slugIndex;
}

/** Busca um ponto real de network-points.ts pelo slug da URL (/ponto/$slug). */
export function findPointBySlug(slug: string): PointWithCategory | undefined {
  return getSlugIndex().get(slug);
}
