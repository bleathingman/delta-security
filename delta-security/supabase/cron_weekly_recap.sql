-- =========================================================
-- DELTA SECURITY — Cron : récap Discord chaque dimanche 17h
-- =========================================================

-- 1. Activer pg_cron (déjà activé sur Supabase)
-- 2. Activer pg_net pour les requêtes HTTP depuis SQL
create extension if not exists pg_net;

-- 3. Créer le job cron (dimanche à 17h00 UTC)
--    Adapter l'heure selon votre fuseau horaire :
--    17h EST  = 22h UTC  → '0 22 * * 0'
--    17h EST  = 21h UTC  → '0 21 * * 0'  (heure d'été)
--    17h heure Montréal  → ajuster selon la saison
select cron.schedule(
  'delta-security-weekly-recap',   -- nom du job
  '0 22 * * 0',                    -- dimanche à 22h UTC (= 17h EST)
  $$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_FUNCTION_URL') || '/weekly-recap',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- 4. Vérifier que le job est bien créé
-- select * from cron.job;

-- =========================================================
-- ALTERNATIVE PLUS SIMPLE : utiliser l'URL directe
-- Remplacer TON_REF et TON_SERVICE_ROLE_KEY ci-dessous
-- =========================================================
/*
select cron.schedule(
  'delta-security-weekly-recap',
  '0 22 * * 0',
  $$
    select net.http_post(
      url     := 'https://TON_REF.supabase.co/functions/v1/weekly-recap',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer TON_SERVICE_ROLE_KEY"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
*/

-- =========================================================
-- Pour supprimer le job si besoin :
-- select cron.unschedule('delta-security-weekly-recap');
-- =========================================================
