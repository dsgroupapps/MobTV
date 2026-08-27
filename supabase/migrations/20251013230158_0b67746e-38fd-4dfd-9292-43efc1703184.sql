-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'advertiser');
CREATE TYPE public.panel_orientation AS ENUM ('vertical', 'horizontal', 'ribbon');
CREATE TYPE public.quote_type AS ENUM ('campaign', 'space');
CREATE TYPE public.quote_status AS ENUM ('pending', 'expired', 'accepted', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'released', 'cancelled');
CREATE TYPE public.asset_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.opp_status AS ENUM ('success', 'fail');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'pending', 'active', 'completed', 'cancelled');

-- User Roles Table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'advertiser',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panels Table
CREATE TABLE public.panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  location POINT,
  active BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panel Formats Table
CREATE TABLE public.panel_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  orientation panel_orientation NOT NULL,
  durations_allowed INTEGER[] NOT NULL DEFAULT ARRAY[15, 30],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panel Hours (weekly schedule)
CREATE TABLE public.panel_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panel Hour Exceptions (special dates)
CREATE TABLE public.panel_hour_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Panel Blackouts (maintenance)
CREATE TABLE public.panel_blackouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing Rules
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  weekday INTEGER CHECK (weekday >= 0 AND weekday <= 6),
  time_start TIME,
  time_end TIME,
  duration_seconds INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  date_start DATE,
  date_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quotes Table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type quote_type NOT NULL,
  date_start DATE,
  date_end DATE,
  duration_seconds INTEGER,
  total_insertions INTEGER,
  status quote_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote Items
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slot Locks (for quote TTL)
CREATE TABLE public.slot_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(panel_id, date, start_time, duration_seconds)
);

-- Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id),
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations (confirmed slots)
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(panel_id, date, start_time, duration_seconds)
);

-- Assets (media files)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  status asset_status NOT NULL DEFAULT 'pending',
  storage_url TEXT,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moderation Logs
CREATE TABLE public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedules (published playlists)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  manifest_url TEXT,
  checksum TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(panel_id, date)
);

-- OPP Logs (Proof of Play)
CREATE TABLE public.opp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES public.panels(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  status opp_status NOT NULL,
  latency_ms INTEGER,
  player_agent TEXT,
  proof_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_panels_active ON public.panels(active);
CREATE INDEX idx_panels_region ON public.panels(region);
CREATE INDEX idx_panel_formats_panel_id ON public.panel_formats(panel_id);
CREATE INDEX idx_panel_hours_panel_id ON public.panel_hours(panel_id);
CREATE INDEX idx_pricing_rules_panel_id ON public.pricing_rules(panel_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_slot_locks_expires_at ON public.slot_locks(expires_at);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_reservations_panel_date ON public.reservations(panel_id, date);
CREATE INDEX idx_assets_order_item_id ON public.assets(order_item_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_opp_logs_panel_id ON public.opp_logs(panel_id);
CREATE INDEX idx_opp_logs_played_at ON public.opp_logs(played_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_hour_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for panels (public read for active panels)
CREATE POLICY "Anyone can view active panels"
  ON public.panels FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins can manage panels"
  ON public.panels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for panel_formats
CREATE POLICY "Anyone can view formats of active panels"
  ON public.panel_formats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.panels p 
    WHERE p.id = panel_id AND (p.active = true OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage formats"
  ON public.panel_formats FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for panel_hours
CREATE POLICY "Anyone can view hours of active panels"
  ON public.panel_hours FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.panels p 
    WHERE p.id = panel_id AND (p.active = true OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage hours"
  ON public.panel_hours FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for panel_hour_exceptions
CREATE POLICY "Anyone can view exceptions of active panels"
  ON public.panel_hour_exceptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.panels p 
    WHERE p.id = panel_id AND (p.active = true OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage exceptions"
  ON public.panel_hour_exceptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for panel_blackouts
CREATE POLICY "Anyone can view blackouts of active panels"
  ON public.panel_blackouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.panels p 
    WHERE p.id = panel_id AND (p.active = true OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage blackouts"
  ON public.panel_blackouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pricing_rules
CREATE POLICY "Anyone can view pricing of active panels"
  ON public.pricing_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.panels p 
    WHERE p.id = panel_id AND (p.active = true OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Admins can manage pricing"
  ON public.pricing_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quotes
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all quotes"
  ON public.quotes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quote_items
CREATE POLICY "Users can view items of their quotes"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.id = quote_id AND q.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all quote items"
  ON public.quote_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for order_items
CREATE POLICY "Users can view items of their orders"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for assets
CREATE POLICY "Users can view their own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload assets for their orders"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins and operators can view all assets"
  ON public.assets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins and operators can moderate assets"
  ON public.assets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for moderation_logs
CREATE POLICY "Admins and operators can view moderation logs"
  ON public.moderation_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins and operators can create moderation logs"
  ON public.moderation_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for schedules (public read for players)
CREATE POLICY "Anyone can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage schedules"
  ON public.schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for opp_logs (players can insert, admins can view)
CREATE POLICY "Anyone can create OPP logs"
  ON public.opp_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins and operators can view OPP logs"
  ON public.opp_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view OPP logs for their assets"
  ON public.opp_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assets a
    WHERE a.id = asset_id AND a.user_id = auth.uid()
  ));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for reservations
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Users can view reservations for their orders"
  ON public.reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND o.user_id = auth.uid()
  ));

-- RLS Policies for slot_locks
CREATE POLICY "System can manage slot locks"
  ON public.slot_locks FOR ALL
  USING (true);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_panels_updated_at
  BEFORE UPDATE ON public.panels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default advertiser role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'advertiser');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();