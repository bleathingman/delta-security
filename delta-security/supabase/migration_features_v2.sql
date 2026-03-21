-- =========================================================
-- DELTA SECURITY — Migration : 4 nouvelles fonctionnalités
-- À exécuter dans SQL Editor
-- =========================================================

-- 1. Commentaire de fin de service sur la table services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS end_comment TEXT;

-- 2. Numéro de téléphone sur les profils
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 3. Table des blâmes / avertissements
CREATE TABLE IF NOT EXISTS public.warnings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patron_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'blame', 'suspension')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS sur warnings
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

-- Agents voient leurs propres avertissements
CREATE POLICY "agents_see_own_warnings" ON public.warnings
  FOR SELECT USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

-- Seuls les patrons peuvent créer des avertissements
CREATE POLICY "patrons_insert_warnings" ON public.warnings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

-- Seuls les patrons peuvent supprimer des avertissements
CREATE POLICY "patrons_delete_warnings" ON public.warnings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_warnings_agent_id ON public.warnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_warnings_created_at ON public.warnings(created_at DESC);
