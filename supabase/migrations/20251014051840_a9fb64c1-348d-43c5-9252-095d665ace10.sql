-- Make order_item_id nullable in assets table since admin uploads don't have order items yet
ALTER TABLE public.assets 
ALTER COLUMN order_item_id DROP NOT NULL;