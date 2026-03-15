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

    // Données du nouvel utilisateur
    const { username, password, full_name, role, hourly_rate, badge_number, grade_id } = await req.json()
    if (!username || !password || !full_name || !role) {
      return json({ error: 'Champs obligatoires manquants (username, password, full_name, role)' }, 400)
    }

    const email = `${username.toLowerCase().trim().replace(/\s+/g, '_')}@deltasecurity.internal`

    // Créer via service_role (admin)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (createError) {
      if (createError.message.includes('already been registered')) {
        return json({ error: `L'identifiant "${username}" est déjà utilisé` }, 409)
      }
      throw createError
    }

    // Mettre à jour le profil (le trigger l'a déjà créé)
    const { error: profileError } = await admin
      .from('profiles')
      .update({ full_name, role, hourly_rate: hourly_rate || 15.00, badge_number: badge_number || null, grade_id: grade_id || null })
      .eq('id', newUser.user.id)
    if (profileError) throw profileError

    return json({ success: true, user_id: newUser.user.id, username, full_name, role })

  } catch (err) {
    console.error('create-user:', err)
    return json({ error: err.message || 'Erreur serveur' }, 500)
  }
})
