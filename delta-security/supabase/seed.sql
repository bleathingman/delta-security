-- =========================================================
-- DELTA SECURITY — Seed : compte admin par défaut
-- À exécuter UNE SEULE FOIS après avoir créé le projet
-- =========================================================

-- ÉTAPE 1 : Créer le compte dans Supabase Auth
-- Aller dans : Dashboard → Authentication → Users → "Add user"
--   Email    : admin@deltasecurity.internal
--   Password : admin
--   ✓ "Auto Confirm User" (cocher)
-- Puis copier l'UUID généré et remplacer ci-dessous.

-- ÉTAPE 2 : Mettre à jour le profil admin
-- Remplacer 'COLLER_UUID_ICI' par l'UUID copié à l'étape 1

UPDATE public.profiles
SET
  full_name    = 'Administrateur',
  role         = 'patron',
  hourly_rate  = 0.00,
  badge_number = 'ADMIN-001'
WHERE id = 'COLLER_UUID_ICI';

-- =========================================================
-- Vérification : ce SELECT doit retourner 1 ligne
-- =========================================================
-- SELECT * FROM public.profiles WHERE badge_number = 'ADMIN-001';

-- =========================================================
-- CONNEXION AU SITE :
--   Identifiant : admin
--   Mot de passe : admin
-- =========================================================
