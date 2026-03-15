-- =========================================================
-- DELTA SECURITY — Migration : ajout is_active sur profiles
-- À exécuter dans SQL Editor si le projet existait déjà
-- (Nouveau projet : déjà inclus dans schema.sql)
-- =========================================================

-- 1. Ajouter la colonne si elle n'existe pas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. S'assurer que tous les profils existants sont actifs
UPDATE public.profiles SET is_active = TRUE WHERE is_active IS NULL;

-- 3. Index pour les requêtes de login
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
