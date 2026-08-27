-- Create filler_media table for admin-managed filler content
CREATE TABLE public.filler_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  storage_url TEXT NOT NULL,
  panel_ids UUID[] DEFAULT ARRAY[]::UUID[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on filler_media
ALTER TABLE public.filler_media ENABLE ROW LEVEL SECURITY;

-- Admins can manage filler media
CREATE POLICY "Admins can manage filler media"
ON public.filler_media
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active filler media (for players to use)
CREATE POLICY "Anyone can view active filler media"
ON public.filler_media
FOR SELECT
USING (active = true);

-- Add delete_at timestamp to assets for scheduled deletion
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS delete_at TIMESTAMP WITH TIME ZONE;

-- Function to set delete_at for advertiser assets (7 days from creation)
CREATE OR REPLACE FUNCTION public.set_asset_deletion_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set deletion date for advertiser assets, not admin assets
  IF NOT has_role(NEW.user_id, 'admin'::app_role) THEN
    NEW.delete_at = NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to automatically set deletion date on asset creation
CREATE TRIGGER set_asset_deletion_trigger
BEFORE INSERT ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.set_asset_deletion_date();

-- Trigger for updated_at on filler_media
CREATE TRIGGER update_filler_media_updated_at
BEFORE UPDATE ON public.filler_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();