-- Analytics first-party do funil QR -> site -> planejador -> WhatsApp.
-- Ver src/lib/analytics/README.md para a arquitetura completa (o que gera
-- cada evento, o que é/não é coletado, limitações conhecidas).
--
-- Escrita EXCLUSIVAMENTE pelas server functions em
-- src/lib/analytics/server.ts (trackPointEvent / trackFunnelEvent) usando a
-- mesma publishable key que o resto do app já usa no servidor -- o browser
-- nunca insere direto aqui. Por isso a policy abaixo cobre só INSERT: não
-- existe policy de SELECT/UPDATE/DELETE, então a tabela fica ilegível para
-- anon/authenticated por padrão (RLS nega o que não tem policy). Consultar
-- os dados exige uma credencial com privilégio de administrador do projeto
-- (service_role ou o SQL editor do Supabase) -- isso é intencional: este
-- bloco entrega só a persistência, não um dashboard.
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  event_name TEXT NOT NULL,
  event_domain TEXT NOT NULL,

  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,

  source TEXT,
  initial_point_slug TEXT,
  point_slug TEXT,
  qr_id TEXT,
  landing_path TEXT,

  category_key TEXT,
  media_type TEXT,
  planning_intent TEXT,

  device_type TEXT,
  os TEXT,
  browser TEXT,
  language TEXT,
  timezone TEXT,

  viewport_width INTEGER,
  viewport_height INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,

  referrer TEXT,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  scroll_depth_percent INTEGER,
  country_code TEXT,

  -- Montada server-side SÓ com campos já conhecidos/seguros (nunca um
  -- passthrough do payload do cliente) -- ver mapPointEventToRow /
  -- mapFunnelEventToRow em src/lib/analytics/persistence.ts.
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  CONSTRAINT analytics_events_event_domain_check
    CHECK (event_domain IN ('point', 'funnel')),
  CONSTRAINT analytics_events_scroll_depth_range
    CHECK (scroll_depth_percent IS NULL OR scroll_depth_percent BETWEEN 0 AND 100)
);

COMMENT ON TABLE public.analytics_events IS
  'Eventos first-party do funil QR -> site -> planejador -> WhatsApp. Só INSERT via server functions; sem policy de leitura pública.';

-- Índices para os filtros/relatórios já previstos (por data, por evento, por
-- domínio, por ponto de origem/atual, por sessão/visitante). Sem índices
-- compostos por falta de um caso de uso concreto ainda.
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_event_domain ON public.analytics_events(event_domain);
CREATE INDEX idx_analytics_events_point_slug ON public.analytics_events(point_slug);
CREATE INDEX idx_analytics_events_initial_point_slug ON public.analytics_events(initial_point_slug);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_visitor_id ON public.analytics_events(visitor_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Único acesso concedido: inserir. Visitante anônimo (role "anon", que é a
-- role da publishable key sem sessão de auth) e usuário autenticado podem
-- gerar um evento através das server functions; ninguém consegue ler,
-- atualizar ou apagar através dessas roles.
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
