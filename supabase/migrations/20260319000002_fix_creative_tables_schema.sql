-- Fix creative_briefs and ad_scripts tables
-- The 20260317 migration used CREATE TABLE IF NOT EXISTS which was a no-op
-- since both tables already existed. This migration adds the missing columns.

-- ═══════════════════════════════════════════════
-- ad_scripts: add new columns from the intended schema
-- ═══════════════════════════════════════════════
ALTER TABLE public.ad_scripts
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS headlines JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS body_copy TEXT,
  ADD COLUMN IF NOT EXISTS body_variants JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS script_body TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS ad_format TEXT,
  ADD COLUMN IF NOT EXISTS angle TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS linked_meta_ad_id UUID REFERENCES meta_ads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES agency_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Migrate existing data: map old columns to new ones
-- body → body_copy (for static ads), script_type → ad_format
UPDATE public.ad_scripts
SET
  body_copy = CASE WHEN script_type = 'static' THEN body ELSE NULL END,
  script_body = CASE WHEN script_type = 'video' THEN body ELSE NULL END,
  ad_format = CASE
    WHEN script_type = 'video' THEN 'video'
    WHEN script_type = 'static' THEN 'image'
    ELSE NULL
  END
WHERE ad_format IS NULL AND (body IS NOT NULL OR script_type IS NOT NULL);

-- Add indexes on new columns
CREATE INDEX IF NOT EXISTS idx_ad_scripts_client ON public.ad_scripts(client_id);
CREATE INDEX IF NOT EXISTS idx_ad_scripts_brief ON public.ad_scripts(brief_id);
CREATE INDEX IF NOT EXISTS idx_ad_scripts_status ON public.ad_scripts(client_id, status);

-- ═══════════════════════════════════════════════
-- creative_briefs: add new columns from the intended schema
-- ═══════════════════════════════════════════════
ALTER TABLE public.creative_briefs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS messaging_angles JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS creative_direction TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'meta',
  ADD COLUMN IF NOT EXISTS ad_format TEXT,
  ADD COLUMN IF NOT EXISTS source_campaigns JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS performance_snapshot JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generation_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES agency_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Back-fill title from client_name for existing briefs
UPDATE public.creative_briefs
SET title = client_name || ' Brief'
WHERE title IS NULL AND client_name IS NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_creative_briefs_client ON public.creative_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_creative_briefs_status ON public.creative_briefs(client_id, status);
