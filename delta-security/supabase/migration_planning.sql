-- =========================================================
-- DELTA SECURITY — Migration : Congés & Planning
-- À exécuter dans SQL Editor
-- =========================================================

-- 1. Table des congés / indisponibilités
CREATE TABLE IF NOT EXISTS public.time_off (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des shifts / plannings
CREATE TABLE IF NOT EXISTS public.shifts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  label       TEXT DEFAULT 'Shift',
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS time_off
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_off_select" ON public.time_off
  FOR SELECT USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "time_off_insert" ON public.time_off
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "time_off_update_agent" ON public.time_off
  FOR UPDATE USING (agent_id = auth.uid() AND status = 'pending');

CREATE POLICY "time_off_update_patron" ON public.time_off
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "time_off_delete" ON public.time_off
  FOR DELETE USING (
    (agent_id = auth.uid() AND status = 'pending') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

-- 4. RLS shifts
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select" ON public.shifts
  FOR SELECT USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "shifts_insert_patron" ON public.shifts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "shifts_update_patron" ON public.shifts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

CREATE POLICY "shifts_delete_patron" ON public.shifts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patron')
  );

-- 5. Index
CREATE INDEX IF NOT EXISTS idx_time_off_agent_id   ON public.time_off(agent_id);
CREATE INDEX IF NOT EXISTS idx_time_off_start_date ON public.time_off(start_date);
CREATE INDEX IF NOT EXISTS idx_shifts_agent_id     ON public.shifts(agent_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time   ON public.shifts(start_time);
