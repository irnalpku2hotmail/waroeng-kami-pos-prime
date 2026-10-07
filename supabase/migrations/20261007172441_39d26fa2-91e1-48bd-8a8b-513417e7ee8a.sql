ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
INSERT INTO public.settings (key, value) VALUES
 ('local_seo_enabled', 'true'::jsonb),
 ('primary_area', '"Rumbai"'::jsonb),
 ('city', '"Pekanbaru"'::jsonb),
 ('province', '"Riau"'::jsonb),
 ('country', '"Indonesia"'::jsonb),
 ('service_areas', '["Rumbai"]'::jsonb),
 ('local_seo_description', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;