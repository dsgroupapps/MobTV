/**
 * Agrupamento dos pontos de `network-points.ts` por região administrativa do
 * DF — usado exclusivamente pela nova seção "Cobertura" (`CoverageMap.tsx`)
 * e pelo filtro por região do Explorador de Ativos (`AssetExplorer.tsx`).
 *
 * Nada aqui é hardcoded por ponto: contagem, mídias e coordenadas de cada
 * região são recalculadas a partir de `networkPoints` sempre que o dataset
 * muda. Os únicos valores fixos são:
 *
 * 1. `REGION_NAMES` — vocabulário de nomes de região real do DF (geografia,
 *    não dado comercial), usado só para casar substring no nome do ponto.
 *    Ordenado do nome mais específico para o mais genérico (ex.: "Sobradinho
 *    II" antes de "Sobradinho") para não classificar errado por prefixo.
 * 2. `PROJECTION` — coeficientes de um ajuste afim (lng/lat → x/y do SVG)
 *    calibrado contra as posições já usadas no mapa de cobertura anterior
 *    (que por sua vez já estavam alinhadas ao contorno real do DF/IBGE) —
 *    é só a fórmula de projeção geográfica, não um dado por ponto.
 *
 * Pontos cujo nome não contém nenhum nome de região diretamente (algumas
 * estações de Metrô nomeadas pelo ponto de referência local, não pela
 * cidade — ex. "Estação Shopping", "Estação Praça do Relógio") são
 * atribuídos à região cujo centróide (calculado a partir dos pontos que
 * bateram por nome) fica geograficamente mais próximo das coordenadas reais
 * do próprio ponto (já validadas via Google Maps). Nenhuma região é
 * atribuída por suposição textual solta — sempre por nome direto ou por
 * distância a partir de coordenadas reais.
 */

import { networkPoints, pointMediaTypes, type MediaTypeKey } from "./network-points";

// Nomes reais de Região Administrativa do DF que aparecem (direta ou
// geograficamente) entre os pontos atuais. "Águas Claras" foi incluída além
// das 16 cidades já usadas no Planejador (`planner-options.ts`) porque há
// pontos reais lá (Estação Águas Claras, Arniqueiras) sem equivalente nas
// 16 originais — ver `regionSummaries` para o total realmente ativo.
const REGION_NAMES = [
  "Sobradinho II",
  "Riacho Fundo II",
  "Recanto das Emas",
  "Vicente Pires",
  "São Sebastião",
  "Núcleo Bandeirante",
  "Santa Maria",
  "Plano Piloto",
  "Águas Claras",
  "Planaltina",
  "Brazlândia",
  "Ceilândia",
  "Taguatinga",
  "Samambaia",
  "Sobradinho",
  "Guará",
  "Gama",
] as const;

function findDirectRegion(nome: string): string | null {
  for (const region of REGION_NAMES) {
    if (nome.includes(region)) return region;
  }
  return null;
}

export type RegionSummary = {
  region: string;
  count: number;
  mediaTypes: MediaTypeKey[];
  pointNames: string[];
  /** Posição projetada no viewBox do SVG do mapa (ver PROJECTION_VIEWBOX). */
  x: number;
  y: number;
};

// Ajuste afim lng/lat → x/y, calibrado por mínimos quadrados contra as 15
// posições x/y já usadas (e visualmente corretas) na versão anterior do
// mapa de cobertura. Erro médio de calibração < 30px num viewBox de 2000px
// de largura — suficiente para um mapa estilizado, não é uma carta náutica.
const PROJECTION = {
  ax: 883.8365,
  bx: -34.2052,
  cx: 42701.108,
  ay: 79.7541,
  by: -843.9583,
  cy: -8516.918,
};
export const PROJECTION_VIEWBOX = { width: 2000, height: 2100 };

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: PROJECTION.ax * lng + PROJECTION.bx * lat + PROJECTION.cx,
    y: PROJECTION.ay * lng + PROJECTION.by * lat + PROJECTION.cy,
  };
}

// Separação mínima (em unidades do viewBox) entre dois pins — a região
// metropolitana central do DF (Ceilândia/Taguatinga/Samambaia/Guará/Águas
// Claras/Vicente Pires...) é geograficamente muito adensada; sem isso, a
// projeção real faria vários pins se sobreporem. Relaxamento determinístico
// simples (empurra pares próximos para longe um do outro, poucas iterações),
// não afeta contagem/mídia — só legibilidade do mapa estilizado.
const MIN_PIN_DISTANCE = 175;

function relaxPositions(items: { x: number; y: number }[]) {
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const dx = items[j].x - items[i].x;
        const dy = items[j].y - items[i].y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < MIN_PIN_DISTANCE) {
          moved = true;
          const push = (MIN_PIN_DISTANCE - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          items[i].x -= ux * push;
          items[i].y -= uy * push;
          items[j].x += ux * push;
          items[j].y += uy * push;
        }
      }
    }
    if (!moved) break;
  }
}

function computeRegionSummaries(): RegionSummary[] {
  const allPoints = networkPoints.flatMap((cat) => cat.points);

  // 1ª passada: pontos cujo nome bate diretamente com uma região.
  const direct: { nome: string; region: string; lat?: number; lng?: number }[] = [];
  const unmatched: { nome: string; lat: number; lng: number }[] = [];
  for (const point of allPoints) {
    const region = findDirectRegion(point.nome);
    if (region) {
      direct.push({ nome: point.nome, region, lat: point.location?.lat, lng: point.location?.lng });
    } else if (point.location) {
      unmatched.push({ nome: point.nome, lat: point.location.lat, lng: point.location.lng });
    }
    // Ponto sem match direto E sem coordenada fica de fora da atribuição
    // geográfica (não deixamos de contar o ponto no total do site — só não
    // aparece no mapa por região, já que não há como localizá-lo).
  }

  // Centróide de cada região a partir dos pontos com match direto e coordenada.
  const coordsByRegion = new Map<string, { lat: number; lng: number }[]>();
  for (const p of direct) {
    if (p.lat == null || p.lng == null) continue;
    if (!coordsByRegion.has(p.region)) coordsByRegion.set(p.region, []);
    coordsByRegion.get(p.region)!.push({ lat: p.lat, lng: p.lng });
  }
  const centroid = new Map<string, { lat: number; lng: number }>();
  for (const [region, coords] of coordsByRegion) {
    const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
    const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
    centroid.set(region, { lat, lng });
  }

  // 2ª passada: pontos sem nome de região, atribuídos à região mais próxima
  // por distância real (coordenadas já validadas via Google Maps).
  const nnAssignment = new Map<string, string>();
  for (const p of unmatched) {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const [region, c] of centroid) {
      const dist = Math.hypot(p.lat - c.lat, p.lng - c.lng);
      if (dist < bestDist) {
        bestDist = dist;
        best = region;
      }
    }
    if (best) nnAssignment.set(p.nome, best);
  }

  // Monta o resumo final por região.
  const byRegion = new Map<string, { pointNames: string[]; mediaTypes: Set<MediaTypeKey> }>();
  const ensure = (region: string) => {
    if (!byRegion.has(region)) byRegion.set(region, { pointNames: [], mediaTypes: new Set() });
    return byRegion.get(region)!;
  };
  for (const point of allPoints) {
    const region = findDirectRegion(point.nome) ?? nnAssignment.get(point.nome);
    if (!region) continue;
    const entry = ensure(region);
    entry.pointNames.push(point.nome);
    for (const mt of pointMediaTypes(point)) entry.mediaTypes.add(mt);
  }

  const summaries: RegionSummary[] = [];
  for (const [region, entry] of byRegion) {
    const c = centroid.get(region);
    if (!c) continue; // sem centróide (sem nenhum ponto com coordenada) — não plota no mapa
    const { x, y } = project(c.lat, c.lng);
    summaries.push({
      region,
      count: entry.pointNames.length,
      mediaTypes: Array.from(entry.mediaTypes),
      pointNames: entry.pointNames,
      x,
      y,
    });
  }

  relaxPositions(summaries);

  return summaries.sort((a, b) => b.count - a.count);
}

/** Fonte única para a seção de Cobertura e para o filtro por região do Explorador de Ativos. */
export const regionSummaries: RegionSummary[] = computeRegionSummaries();

/** Total de regiões com pelo menos 1 ponto ativo — não hardcodar "16". */
export const activeRegionCount = regionSummaries.length;
