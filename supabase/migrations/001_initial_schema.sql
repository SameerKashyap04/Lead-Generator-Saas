-- ============================================================
-- LeadScaper Pro — Supabase PostgreSQL Schema
-- Run this migration in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ───────────────────────────────────────────────────
-- Auto-populated on user signup via trigger

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── Workspaces ─────────────────────────────────────────────────

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace"
  ON public.workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update workspace"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ─── Workspace Members ─────────────────────────────────────────

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner/Admin can insert members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owner can delete members"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.role = 'owner'
    )
  );

-- ─── Projects ───────────────────────────────────────────────────

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view projects"
  ON public.projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update projects"
  ON public.projects FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete projects"
  ON public.projects FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ─── Leads ──────────────────────────────────────────────────────

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  rating NUMERIC(2,1),
  review_count INTEGER,
  phone TEXT,
  website TEXT,
  emails TEXT[] NOT NULL DEFAULT '{}',
  full_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  google_maps_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  business_hours JSONB,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('open', 'closed', 'unknown')),
  social_media JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  session_id TEXT,
  contacted BOOLEAN NOT NULL DEFAULT FALSE,
  contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_project ON public.leads(project_id);
CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_business_name ON public.leads(business_name);
CREATE INDEX idx_leads_category ON public.leads(category);
CREATE INDEX idx_leads_city ON public.leads(city);
CREATE INDEX idx_leads_scraped_at ON public.leads(scraped_at);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view leads"
  ON public.leads FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update leads"
  ON public.leads FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete leads"
  ON public.leads FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ─── Campaigns ──────────────────────────────────────────────────

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'project' CHECK (source IN ('project', 'csv', 'excel', 'json')),
  message_template TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  contacted_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace ON public.campaigns(workspace_id);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view campaigns"
  ON public.campaigns FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ─── Campaign Recipients ────────────────────────────────────────

CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  city TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'follow_up', 'completed', 'failed')),
  contacted_at TIMESTAMPTZ
);

CREATE INDEX idx_recipients_campaign ON public.campaign_recipients(campaign_id);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage recipients via campaign"
  ON public.campaign_recipients FOR ALL
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspace_members wm ON c.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- ─── Subscriptions ──────────────────────────────────────────────

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  payu_subscription_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── Payments ───────────────────────────────────────────────────

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payu_txn_id TEXT,
  payu_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Usage Logs ─────────────────────────────────────────────────

CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  leads_scraped INTEGER NOT NULL DEFAULT 0,
  exports_count INTEGER NOT NULL DEFAULT 0,
  campaigns_count INTEGER NOT NULL DEFAULT 0,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  UNIQUE(workspace_id, month)
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view usage"
  ON public.usage_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ─── Exports ────────────────────────────────────────────────────

CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'json')),
  lead_count INTEGER NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exports_workspace ON public.exports(workspace_id);

ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage exports"
  ON public.exports FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ─── Activity Logs ──────────────────────────────────────────────

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON public.activity_logs(workspace_id, created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity"
  ON public.activity_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── User Settings ──────────────────────────────────────────────

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  scraping_speed TEXT NOT NULL DEFAULT 'moderate' CHECK (scraping_speed IN ('slow', 'moderate', 'fast')),
  export_format TEXT NOT NULL DEFAULT 'csv' CHECK (export_format IN ('csv', 'xlsx', 'json')),
  auto_save_progress BOOLEAN NOT NULL DEFAULT TRUE,
  max_retries INTEGER NOT NULL DEFAULT 3,
  email_discovery_depth TEXT NOT NULL DEFAULT 'shallow' CHECK (email_discovery_depth IN ('shallow', 'deep')),
  data_retention_days INTEGER NOT NULL DEFAULT 90,
  show_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_mode TEXT NOT NULL DEFAULT 'web' CHECK (whatsapp_mode IN ('web', 'desktop')),
  default_country_code TEXT NOT NULL DEFAULT '+91',
  whatsapp_send_mode TEXT NOT NULL DEFAULT 'manual' CHECK (whatsapp_send_mode IN ('manual', 'auto')),
  whatsapp_daily_limit INTEGER NOT NULL DEFAULT 50,
  whatsapp_min_delay INTEGER NOT NULL DEFAULT 5,
  whatsapp_max_delay INTEGER NOT NULL DEFAULT 15,
  UNIQUE(user_id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.settings FOR ALL
  USING (auth.uid() = user_id);

-- ─── Import History ─────────────────────────────────────────────

CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('csv', 'excel', 'json')),
  records_imported INTEGER NOT NULL DEFAULT 0,
  valid_records INTEGER NOT NULL DEFAULT 0,
  invalid_records INTEGER NOT NULL DEFAULT 0,
  duplicates_removed INTEGER NOT NULL DEFAULT 0,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage import history"
  ON public.import_history FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ─── Functions & Triggers ───────────────────────────────────────

-- Auto-create profile, workspace, subscription, and settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Get user name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  -- Create default workspace
  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (NEW.id, user_name || '''s Workspace', user_slug)
  RETURNING id INTO new_workspace_id;

  -- Add owner to workspace members
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  -- Create default settings
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);

  -- Create initial usage log
  INSERT INTO public.usage_logs (workspace_id, month)
  VALUES (new_workspace_id, TO_CHAR(NOW(), 'YYYY-MM'));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Helper Views ───────────────────────────────────────────────

-- Project stats view (used by dashboard)
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
  p.id,
  p.workspace_id,
  p.name,
  p.description,
  p.color,
  p.icon,
  p.created_at,
  p.updated_at,
  COUNT(l.id)::INTEGER AS total_leads,
  COUNT(CASE WHEN array_length(l.emails, 1) > 0 THEN 1 END)::INTEGER AS total_emails,
  COUNT(CASE WHEN l.phone IS NOT NULL THEN 1 END)::INTEGER AS total_phones,
  COUNT(CASE WHEN l.website IS NOT NULL THEN 1 END)::INTEGER AS total_websites,
  COUNT(CASE WHEN l.contacted = TRUE THEN 1 END)::INTEGER AS contacted_count
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
GROUP BY p.id;

-- ─── Storage Bucket ─────────────────────────────────────────────

-- Create storage bucket for campaign images (run separately in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('campaign-images', 'campaign-images', true);
