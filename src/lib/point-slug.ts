import { networkPoints, type Category, type NetworkPoint } from "@/data/network-points";

export type PointWithCategory = { point: NetworkPoint; category: Category };

let slugIndex: Map<string, PointWithCategory> | null = null;

function getSlugIndex(): Map<string, PointWithCategory> {
  if (slugIndex) return slugIndex;
  slugIndex = new Map();
  for (const category of networkPoints) {
    for (const point of category.points) {
      slugIndex.set(point.slug, { point, category });
    }
  }
  return slugIndex;
}

/** Busca um ponto real de network-points.ts pelo slug da URL (/ponto/$slug). */
export function findPointBySlug(slug: string): PointWithCategory | undefined {
  return getSlugIndex().get(slug);
}
