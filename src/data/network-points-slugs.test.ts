import assert from "node:assert/strict";
import test from "node:test";

import { networkPoints } from "./network-points.ts";

const slugsBeforeFreeze = [
  ["Estação Central (Plano Piloto)", "estacao-central-plano-piloto"],
  ["Estação Shopping", "estacao-shopping"],
  ["Estação Feira", "estacao-feira"],
  ["Estação Guará", "estacao-guara"],
  ["Estação Ceilândia Centro", "estacao-ceilandia-centro"],
  ["Estação Ceilândia Sul", "estacao-ceilandia-sul"],
  ["Estação Ceilândia Norte", "estacao-ceilandia-norte"],
  ["Estação Guariroba", "estacao-guariroba"],
  ["Estação Águas Claras", "estacao-aguas-claras"],
  ["Estação Arniqueiras", "estacao-arniqueiras"],
  ["Estação Praça do Relógio", "estacao-praca-do-relogio"],
  ["Rodoviária do Plano Piloto", "rodoviaria-do-plano-piloto"],
  ["Rodoviária de Sobradinho", "rodoviaria-de-sobradinho"],
  ["Terminal BRT Santa Maria", "terminal-brt-santa-maria"],
  ["Terminal BRT Gama", "terminal-brt-gama"],
  ['Terminal Setor "O"', "terminal-setor-o"],
  ["UPA Ceilândia", "upa-ceilandia"],
  ["UPA Samambaia", "upa-samambaia"],
  ["UPA São Sebastião", "upa-sao-sebastiao"],
  ["UPA Sobradinho II", "upa-sobradinho-ii"],
  ["UPA Gama", "upa-gama"],
  ["UPA Recanto das Emas", "upa-recanto-das-emas"],
  ["UPA Riacho Fundo II", "upa-riacho-fundo-ii"],
  ["UPA Planaltina", "upa-planaltina"],
  ["UPA Vicente Pires", "upa-vicente-pires"],
  ["UPA Brazlândia", "upa-brazlandia"],
  ["UPA Ceilândia Setor O", "upa-ceilandia-setor-o"],
  ["Hospital Regional de Taguatinga", "hospital-regional-de-taguatinga"],
  ["Hospital Regional de Ceilândia", "hospital-regional-de-ceilandia"],
  ["Hospital Regional do Gama", "hospital-regional-do-gama"],
  ["Hospital Regional de Sobradinho", "hospital-regional-de-sobradinho"],
  ["Hospital Regional de Santa Maria", "hospital-regional-de-santa-maria"],
  ["Feira do Guará", "feira-do-guara"],
  ["Feira dos Goianos", "feira-dos-goianos"],
  ["Feira Modelo de Sobradinho I", "feira-modelo-de-sobradinho-i"],
  ["Feira da Ceilândia", "feira-da-ceilandia"],
  ["Feira de Samambaia", "feira-de-samambaia"],
  ["Feira Samambaia 2", "feira-samambaia-2"],
  ["Na Hora Ceilândia", "na-hora-ceilandia"],
  ["Na Hora Taguatinga", "na-hora-taguatinga"],
  ["Na Hora Rodoviária Plano Piloto", "na-hora-rodoviaria-plano-piloto"],
  ["Na Hora Gama", "na-hora-gama"],
  ["Na Hora Brazlândia", "na-hora-brazlandia"],
  ["Na Hora Sobradinho", "na-hora-sobradinho"],
] as const;

test("mantém os 44 slugs públicos idênticos ao snapshot anterior", () => {
  const current = networkPoints.flatMap((category) =>
    category.points.map((point) => [point.nome, point.slug] as const),
  );

  assert.deepEqual(current, slugsBeforeFreeze);
  assert.equal(new Set(current.map(([, slug]) => slug)).size, 44);
});
