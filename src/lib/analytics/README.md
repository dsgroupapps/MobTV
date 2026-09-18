# Analytics first-party (QR / funil da jornada)

Instrumentação e persistência dos eventos gerados pela página de perfil de
ponto (`/ponto/$slug`, destino dos QR Codes físicos) e pelo funil da jornada
(QR → site → planejador → WhatsApp). **Sem dashboard, relatório ou export
neste bloco** — só a captura e a gravação dos eventos.

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
tem policy). Ler os dados hoje exige acesso de administrador do projeto
Supabase (SQL editor ou `service_role`, que este bloco **não** usa nem
introduz).

## Limitações conhecidas

- UTM só existe em eventos de ponto; eventos de funil ainda não carregam UTM.
- Atribuição é por aba (`sessionStorage`): não sobrevive a nova aba, fechar o
  navegador ou trocar de dispositivo.
- Sem dashboard/relatório/export — consulta hoje só via SQL direto no
  Supabase (por quem tiver acesso ao projeto).
- Sem retenção/expurgo automático — histórico preservado indefinidamente por
  enquanto.

## Status da migration remota

A migration `20260917000000_create_analytics_events.sql` existe **só
localmente neste repositório**. O ambiente onde este código foi escrito não
tem `SUPABASE_ACCESS_TOKEN`/projeto linkado (`supabase projects list` e
`supabase migration list` falham por falta de autenticação) — não há
permissão nem tentativa de aplicar a migration no projeto remoto a partir
daqui. **Alguém com acesso ao projeto Supabase precisa rodar**:

```
supabase login
supabase link --project-ref vcatcyczpufqyfugwcyv
supabase db push
```

(ou aplicar o SQL da migration diretamente pelo SQL editor do Supabase).
Até isso acontecer, os `INSERT`s desta feature falham em produção — o
`console.error` estruturado em `persistence.ts`
(`kind: "analytics_event_insert_failed"`, código `42P01` — tabela
inexistente) é o sinal a procurar nos logs do Render.

## Como testar

```
node --test src/lib/analytics/persistence.test.ts
```

Cobre o mapeamento payload → linha, sanitização/limites de texto e
`metadata`, preservação de `visitorId`/`sessionId`/UTM/device quando
presentes, ausência de PII/IP/user-agent bruto, e o comportamento best-effort
de `insertAnalyticsEvent` (nunca lança, mesmo com Supabase indisponível).
Roda 100% mockado — não toca o Supabase remoto.

Depois que a migration acima for aplicada, dá para validar o `INSERT` real
gerando um evento manualmente (ex. abrindo `/ponto/<algum-slug>?src=qr` em
produção ou local com `.env.local` apontando pro Supabase certo) e
conferindo a linha em `analytics_events` pelo SQL editor.
