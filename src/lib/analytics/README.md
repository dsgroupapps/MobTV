# Analytics first-party (QR / funil da jornada)

Instrumentação e persistência dos eventos gerados pela página de perfil de
ponto (`/ponto/$slug`, destino dos QR Codes físicos) e pelo funil da jornada
(QR → site → planejador → WhatsApp), a camada de agregação/reporting que
transforma esses eventos em métricas, e o envio desse relatório por e-mail
(HTML + CSV anexado). **Ainda sem agendamento/cron automático** — o envio é
manual/sob demanda por enquanto.

## Arquitetura

```
browser
  → client.ts / funnel.ts        (monta o payload; nunca lança em falha)
  → createServerFn (TanStack Start)
  → server.ts                    (valida o evento)
  → persistence.ts               (mapeia payload → linha de analytics_events)
  → supabase.ts                  (client Supabase server-only, mesma
                                   publishable key que o resto do app)
  → tabela analytics_events (Postgres/Supabase)
```

O deploy roda como **Node server no Render** (Nitro preset `node-server`),
não como Cloudflare Worker — não há binding de KV/D1/R2/Analytics Engine
disponível. `readApproxCountry()` em `server.ts` lê o cabeçalho
`CF-IPCountry` de forma oportunista (só existe se algum proxy Cloudflare
estiver na frente do Render); na ausência dele, `country_code` fica `null`.

**Leitura (produção)**, para gerar relatórios — nunca pelo browser:

```
analytics_events (Postgres)
  → Edge Function privada "get-analytics-events" (Lovable Cloud,
    autenticada por ANALYTICS_API_KEY, roda com privilégio elevado do lado
    do Lovable Cloud sem expor esse privilégio a este servidor)
  → EdgeFunctionAnalyticsEventsRepository (reporting/repository.ts)
  → buildAnalyticsReportForRange (reporting/report.ts)
  → AnalyticsReport (overview, funil, breakdowns, insights — ver
    reporting/types.ts)
  → generateAnalyticsReportPackage (report-delivery/package.ts)
    → HTML + texto + CSV bruto (report-delivery/html.ts, text.ts, csv.ts)
  → sendAnalyticsReport (report-delivery/send.ts) → Resend (anexo CSV)
```

Ver as seções **Reporting (Blocos B/C)** e **Envio por e-mail (Bloco D)**
abaixo para os detalhes.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `context.ts` | `visitorId`/`sessionId` (localStorage/sessionStorage) e leitura de device/browser/OS via `navigator`. |
| `session.ts` | Atribuição de first-touch do funil (`source`, `initialPointSlug`, `qrId`, `landingPath`), gravada uma vez por sessão. |
| `client.ts` | `createPointTracker` — dispara eventos de ponto (`point_*`, `qr_landing`). |
| `funnel.ts` | `trackFunnel` — dispara eventos do funil (`site_continue`, `planner_*`). |
| `server.ts` | Duas server functions (`trackPointEvent`, `trackFunnelEvent`): validam o payload e persistem. |
| `persistence.ts` | Mapeia `PointEventPayload`/`FunnelEventPayload` → linha de `analytics_events`; sanitiza texto/metadata; faz o `insert` (nunca lança). |
| `supabase.ts` | Client Supabase server-only dedicado à escrita, sem cookies/sessão de auth. |
| `types.ts` | Nomes/schema dos eventos. |

Consumidores (únicos pontos do site que disparam eventos):
`src/routes/ponto.$slug.tsx`, `src/components/site/PointProfile.tsx`,
`src/components/site/CampaignPlanner.tsx`.

## Eventos

**Domínio `point`** (perfil de ponto / QR):
`point_profile_view`, `point_scroll_depth`, `point_maps_click`,
`point_site_click`, `qr_landing`, `point_view`.

**Domínio `funnel`** (jornada QR → site → planejador → WhatsApp):
`site_continue`, `planner_open`, `planner_start`, `planner_point_add`,
`planner_media_select`, `planner_summary_view`, `planner_submit`.

`point_whatsapp_click` e `point_email_click` existem no schema de tipos mas
**não são disparados por nenhum componente hoje** (a página usa formulário
de lead em vez de links diretos) — permanecem definidos, mas mortos, até
alguém reativar esse CTA.

## Armazenamento

Tabela única `public.analytics_events` (Postgres, no mesmo projeto Supabase
já usado pelo resto do produto). Ver
`supabase/migrations/20260917000000_create_analytics_events.sql` para o
schema completo. `event_domain` (`"point"` | `"funnel"`) distingue os dois
grupos de eventos sem precisar de tabelas separadas.

`metadata` (jsonb) carrega só um punhado fixo de campos já tipados
(`pointName`, `assetId`, `isFirstVisit`, `msSincePageLoad`,
`clientTimestamp` para eventos de ponto; `firstTouchAt`, `currentPath`,
`clientTimestamp` para eventos de funil) — nunca um passthrough do payload
recebido do cliente, e é cortada se ultrapassar ~4KB serializada.

## Privacidade / minimização

**Nunca armazenado**: nome, e-mail, telefone, texto de formulário, IP bruto,
user-agent bruto. O formulário de lead da página de ponto
(`src/lib/leads/point-lead.ts`, envio por e-mail via Resend) é um sistema
**separado e desconectado** deste — não escreve em `analytics_events`.

**Armazenado**: `visitorId`/`sessionId` (UUIDs aleatórios, sem vínculo com
identidade real), device/OS/browser inferidos do `navigator.userAgent` (nunca
a string bruta), idioma, timezone, dimensões de tela/viewport, referrer,
UTMs (só em eventos de ponto — funil ainda não carrega UTM, ver limitações),
`country_code` aproximado por cabeçalho de borda (nunca IP).

## Sessão / atribuição

- `visitorId` (localStorage, `mobtv_visitor_id`): sobrevive entre visitas.
- `sessionId` (sessionStorage, `mobtv_session_id`): por aba/sessão.
- Atribuição de first-touch (sessionStorage, `mobtv_funnel_attribution`):
  gravada uma vez ao abrir `/ponto/$slug`, nunca sobrescrita — por isso
  `initialPointSlug`/`source`/`qrId` sobrevivem à navegação por `/`, `/rede`,
  `/midia`, `/planejador` na mesma aba.

## Segurança / RLS

A tabela é gravada **só pelo servidor**, via a mesma publishable/anon key
que o resto do app já usa em `src/lib/supabase/server.ts` — o browser nunca
insere direto no Supabase. A policy de RLS cobre **exclusivamente INSERT**
para `anon`/`authenticated`; não existe policy de `SELECT`/`UPDATE`/`DELETE`,
então a tabela é ilegível com essa mesma key (RLS nega por padrão o que não
tem policy) — e essa policy **não foi alterada** para viabilizar a leitura.

A leitura em produção passa por uma Edge Function privada
(`get-analytics-events`, Lovable Cloud) autenticada por `ANALYTICS_API_KEY`
— ela roda com privilégio elevado do lado do Lovable Cloud, sem expor esse
privilégio a este servidor Node. Ver **Reporting (Blocos B/C)** abaixo.

## Reporting (Blocos B/C)

`src/lib/analytics/reporting/` transforma linhas de `analytics_events` em
métricas (`buildAnalyticsReport`, puro) e busca essas linhas do banco LIVE
(`buildAnalyticsReportForRange` + um `AnalyticsEventsRepository`).

**Repositório de produção**: `createEdgeFunctionAnalyticsEventsRepository()`
(`reporting/repository.ts`) — chama a Edge Function privada
`get-analytics-events`, pagina via `cursor`/`hasMore`, e divide
automaticamente períodos acima de 92 dias em janelas consecutivas (limite
do endpoint). Autentica com o header `x-analytics-api-key`, lido de
`ANALYTICS_API_KEY` (`process.env`, **nunca** `VITE_ANALYTICS_API_KEY` —
essa env var não pode existir, ou vazaria a chave para o bundle do browser).
`includeTestEvents` é repassado à Edge Function E reaplicado dentro de
`buildAnalyticsReport` (defesa em profundidade: dois filtros independentes
contra eventos de teste).

`createSupabaseAnalyticsEventsRepository()` (mesmo arquivo) está marcada
`@deprecated` — não é mais o caminho recomendado: a publishable/anon key
nunca teve `SELECT` em `analytics_events` (ver seção anterior) e nenhuma
mudança de RLS foi feita para viabilizar isso. Mantida só por compatibilidade
com testes já existentes do Bloco B.

`createInMemoryAnalyticsEventsRepository()` é o que os testes usam — nunca
toca rede.

## Envio por e-mail (Bloco D)

`src/lib/analytics/report-delivery/` apresenta o `AnalyticsReport` do Bloco B
como e-mail — **nenhuma métrica é recalculada aqui**, só formatada.

- `generateAnalyticsReportPackage({ repository, start, end, timezone?, includeTestEvents? })`
  — GERAÇÃO, sem enviar nada: busca as linhas do período atual e do anterior
  (as mesmas duas chamadas que `buildAnalyticsReportForRange` já faz),
  monta o `AnalyticsReport`, e a partir dele gera `html`, `text` e `csv`
  (reaproveitando as linhas do período atual já em memória — nenhuma
  terceira consulta à Edge Function só para o CSV). É o modo **dry-run**:
  devolve `{ report, html, text, csv, csvBytes, filename }` para inspeção,
  sem chamar Resend.
- `sendAnalyticsReport({ repository, start, end, recipient? })` — ENVIO:
  valida a configuração do Resend primeiro (falha rápido, sem gastar uma
  chamada à Edge Function se já sabe que não vai enviar), chama
  `generateAnalyticsReportPackage` e envia via `sendEmailWithCsvAttachment`
  (`report-delivery/resend-client.ts` — mesmo padrão de fetch cru de
  `src/lib/leads/point-lead.ts`, sem SDK do Resend, só com `attachments`
  adicionado no formato documentado pela API do Resend:
  `{ filename, content: <base64>, content_type }`).

**CSV**: `mobtv-analytics-YYYY-MM-DD_YYYY-MM-DD.csv`, UTF-8 com BOM (para o
Excel detectar a codificação certa), CRLF, escaping RFC4180 (vírgula/aspas/
quebra de linha), `metadata` serializada como JSON dentro do campo. Reusa
`selectRawAnalyticsEvents` do Bloco B — mesma exclusão de eventos de teste
por padrão, mesmo `[start,end)`, mesma ausência de PII/IP/user-agent bruto
(a tabela não tem essas colunas).

**Limite do anexo**: 8 MiB de CSV bruto (~10,7 MiB em Base64) — bem abaixo
do limite de 40 MB pós-Base64 do Resend. Se o CSV exceder isso,
`sendAnalyticsReport` falha ANTES de enviar (nunca trunca dado bruto
silenciosamente).

**Env vars** (todas server-only, nunca `VITE_*`):

```
ANALYTICS_API_KEY=       # leitura da Edge Function (Bloco C)
RESEND_API_KEY=          # mesma chave já usada por src/lib/leads/point-lead.ts
MOBTV_ANALYTICS_FROM_EMAIL=  # remetente; fallback documentado p/ MOBTV_LEADS_FROM_EMAIL se ausente
MOBTV_ANALYTICS_TO_EMAIL=    # destinatário padrão — SEM fallback para e-mail de leads
```

`sendAnalyticsReport` falha com mensagem clara (nunca a chave/secret) se
`RESEND_API_KEY` ou um remetente/destinatário válido estiverem ausentes.
`recipient` só é aceito como parâmetro de chamada server-side manual — esta
função não é exposta por nenhuma rota pública.

**Dry-run** (gera sem enviar, útil para testar/inspecionar):

```ts
const pkg = await generateAnalyticsReportPackage({
  repository: createEdgeFunctionAnalyticsEventsRepository(),
  start: new Date("2026-09-08T00:00:00.000Z"),
  end: new Date("2026-09-15T00:00:00.000Z"),
});
// pkg.report / pkg.html / pkg.text / pkg.csv / pkg.filename / pkg.csvBytes
```

## Limitações conhecidas

- UTM só existe em eventos de ponto; eventos de funil ainda não carregam UTM.
- Atribuição é por aba (`sessionStorage`): não sobrevive a nova aba, fechar o
  navegador ou trocar de dispositivo.
- Sem agendamento automático (cron/scheduler) — `sendAnalyticsReport` precisa
  ser chamado manualmente ou por alguma automação externa a este bloco.
- Sem dashboard visual nem PDF — só HTML de e-mail, texto e CSV.
- Sem retenção/expurgo automático — histórico preservado indefinidamente por
  enquanto.

## Status da migration remota

Aplicada. `public.analytics_events` existe no projeto Supabase LIVE
(`vcatcyczpufqyfugwcyv`) com RLS ativo, a policy de `INSERT` para
`anon`/`authenticated`, e os 7 índices da migration
(`20260917000000_create_analytics_events.sql`) — confirmado no banco real,
não só no repositório.

## Como testar

```
node --test $(find src/lib/analytics -iname "*.test.ts")
```

Cobre: mapeamento payload → linha (`persistence.ts`), sanitização/limites de
texto e `metadata`, ausência de PII/IP/user-agent bruto, comportamento
best-effort de `insertAnalyticsEvent`; no pacote `reporting/`: definição de
cada métrica, funil geral vs. QR, atribuição por `initial_point_slug`,
breakdowns por sessão, período `[start,end)`, exclusão de eventos de teste,
comparação com período anterior, e o repositório de Edge Function (request,
paginação, janelas de 92 dias, erros); e no pacote `report-delivery/`:
renderização HTML/texto sem NaN/Infinity, escaping HTML de valores
dinâmicos, CSV (header/escaping/BOM/metadata JSON), geração vs. envio
separados, configuração ausente (API key/from/recipient), sucesso/erro do
Resend, secret nunca aparece em erro, limite de anexo. Tudo com `fetch`
mockado, nunca contra a rede real.
