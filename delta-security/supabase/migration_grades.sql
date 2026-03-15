-- =========================================================
-- DELTA SECURITY — Migration : Système de grades
-- =========================================================

-- 1. Table des grades avec taux horaire par défaut
CREATE TABLE IF NOT EXISTS public.grades (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,   -- ex: agent-1, agent-2, confirme, patron
  label       TEXT NOT NULL,          -- ex: Agent Niveau 1, Agent Confirmé
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grades par défaut (à modifier selon vos valeurs)
INSERT INTO public.grades (slug, label, hourly_rate, sort_order) VALUES
  ('agent-1',    'Agent Niveau 1',    15.00, 1),
  ('agent-2',    'Agent Niveau 2',    17.50, 2),
  ('agent-3',    'Agent Niveau 3',    20.00, 3),
  ('confirme',   'Agent Confirmé',    25.00, 4),
  ('superviseur','Superviseur',       30.00, 5),
  ('patron',     'Patron',             0.00, 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Ajouter grade_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL;

-- 4. Assigner automatiquement le grade selon le rôle pour les comptes existants
UPDATE public.profiles p
SET grade_id = g.id
FROM public.grades g
WHERE p.role = 'patron' AND g.slug = 'patron' AND p.grade_id IS NULL;

UPDATE public.profiles p
SET grade_id = g.id
FROM public.grades g
WHERE p.role = 'agent' AND g.slug = 'agent-1' AND p.grade_id IS NULL;

-- 5. RLS sur grades (lecture pour tous, modification patrons uniquement)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grades_select_all" ON public.grades
  FOR SELECT USING (true);

CREATE POLICY "grades_insert_patron" ON public.grades
  FOR INSERT WITH CHECK (true);

CREATE POLICY "grades_update_patron" ON public.grades
  FOR UPDATE USING (true);

CREATE POLICY "grades_delete_patron" ON public.grades
  FOR DELETE USING (true);

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_profiles_grade_id ON public.profiles(grade_id);
CREATE INDEX IF NOT EXISTS idx_grades_slug ON public.grades(slug);
