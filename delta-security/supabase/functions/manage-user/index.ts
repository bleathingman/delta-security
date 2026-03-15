// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autorisé' }, 401)

    // Vérifier que l'appelant est un patron
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) return json({ error: 'Session invalide' }, 401)

    const { data: callerProfile } = await supabaseUser
      .from('profiles').select('role').eq('id', caller.id).single()
    if (callerProfile?.role !== 'patron') return json({ error: 'Réservé aux patrons' }, 403)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { action, target_id, new_password, is_active } = await req.json()

    // ── Réinitialiser le mot de passe ──────────────────────
    if (action === 'reset_password') {
      if (!target_id || !new_password) return json({ error: 'target_id et new_password requis' }, 400)
      if (target_id === caller.id) return json({ error: 'Utilisez le formulaire personnel' }, 400)
      if (new_password.length < 6) return json({ error: 'Minimum 6 caractères' }, 400)
      const { error } = await admin.auth.admin.updateUserById(target_id, { password: new_password })
      if (error) throw error
      return json({ success: true })
    }

    // ── Activer / désactiver ───────────────────────────────
    if (action === 'set_active') {
      if (!target_id || is_active === undefined) return json({ error: 'target_id et is_active requis' }, 400)
      if (target_id === caller.id) return json({ error: 'Impossible de vous désactiver vous-même' }, 400)
      const { error } = await admin.from('profiles').update({ is_active }).eq('id', target_id)
      if (error) throw error
      if (!is_active) await admin.auth.admin.signOut(target_id)
      return json({ success: true, is_active })
    }

    // ── Supprimer un compte ────────────────────────────────
    if (action === 'delete_user') {
      if (!target_id) return json({ error: 'target_id requis' }, 400)
      if (target_id === caller.id) return json({ error: 'Impossible de supprimer votre propre compte' }, 400)
      const { error } = await admin.auth.admin.deleteUser(target_id)
      if (error) throw error
      return json({ success: true })
    }

    return json({ error: 'Action non reconnue. Valides: reset_password, set_active, delete_user' }, 400)

  } catch (err) {
    console.error('manage-user:', err)
    return json({ error: err.message || 'Erreur serveur' }, 500)
  }
})
