# Déployer la Edge Function `create-user`

La Edge Function permet aux patrons de créer des comptes agents
sans exposer la clé service_role côté client.

## Prérequis

```bash
npm install -g supabase
supabase login
```

## Déployer

```bash
# Dans le dossier du projet
supabase functions deploy create-user --project-ref TON_PROJECT_REF
```

> `TON_PROJECT_REF` = les 20 caractères dans l'URL de ton projet Supabase
> Ex: `https://XXXXXXXXXXXXXXXXXXXX.supabase.co` → ref = `XXXXXXXXXXXXXXXXXXXX`

## Variables d'environnement (automatiques)

Supabase injecte automatiquement ces variables dans les Edge Functions :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Aucune configuration manuelle requise.

## Tester

```bash
supabase functions serve create-user --env-file .env
```
