-- =========================================
-- DELTA SECURITY — Schema Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- =========================================

-- 1. Table profiles (étend auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('agent', 'patron')),
  hourly_rate  DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  badge_number TEXT UNIQUE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Allow patrons to insert profiles (needed by Edge Function via service_role)
CREATE POLICY "service_role_insert_profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 2. Table services (prises/fins de service)
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time         TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN end_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,
  mission_label    TEXT DEFAULT 'Mission standard',
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vue salaires hebdomadaires
CREATE OR REPLACE VIEW public.weekly_salaries AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.role,
  p.hourly_rate,
  DATE_TRUNC('week', s.start_time) AS week_start,
  COUNT(s.id) AS total_services,
  COALESCE(SUM(s.duration_minutes), 0) AS total_minutes,
  ROUND(
    COALESCE(SUM(s.duration_minutes), 0) / 10.0 * (p.hourly_rate / 6.0), 2
  ) AS weekly_salary
FROM public.profiles p
LEFT JOIN public.services s
  ON s.user_id = p.id AND s.end_time IS NOT NULL
GROUP BY p.id, p.full_name, p.role, p.hourly_rate, DATE_TRUNC('week', s.start_time);

-- 4. RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Profiles: chacun voit son propre profil, les patrons voient tous
CREATE POLICY "agents_see_own_profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Services: agents voient les leurs, patrons voient tout
CREATE POLICY "agents_see_own_services" ON public.services
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "agents_insert_own_services" ON public.services
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "agents_update_own_services" ON public.services
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Fonction trigger pour créer un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Agent'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Index performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_start_time ON public.services(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
