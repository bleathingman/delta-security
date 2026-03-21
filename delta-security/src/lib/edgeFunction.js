import { supabase } from '@/lib/supabase'

export async function callEdgeFunction(functionName, body) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Session expirée, veuillez vous reconnecter')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify(body)
    }
  )

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`)
  return json
}
