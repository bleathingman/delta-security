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
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
    if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL non configuré dans les secrets Supabase')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Semaine courante (lundi → dimanche) ────────────────
    const now       = new Date()
    const dayOfWeek = now.getDay()
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMon)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const fmt = (d) => d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'long' })
    const weekLabel = `${fmt(monday)} — ${sunday.toLocaleDateString('fr-CA', { day: '2-digit', month: 'long', year: 'numeric' })}`

    // ── Profils actifs ─────────────────────────────────────
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, role, hourly_rate, badge_number, phone_number, grades(label)')
      .eq('is_active', true)
      .order('full_name')

    // ── Services de la semaine ─────────────────────────────
    const { data: services } = await admin
      .from('services')
      .select('user_id, duration_minutes, start_time')
      .not('end_time', 'is', null)
      .gte('start_time', monday.toISOString())
      .lte('start_time', sunday.toISOString())

    // ── Calcul salaires ────────────────────────────────────
    const salaries = (profiles || [])
      .map(p => {
        const mine    = (services || []).filter(s => s.user_id === p.id)
        const minutes = mine.reduce((a, s) => a + (s.duration_minutes || 0), 0)
        const salary  = +(minutes * (p.hourly_rate / 60)).toFixed(2)
        const h       = Math.floor(minutes / 60)
        const m       = minutes % 60
        return {
          full_name:      p.full_name,
          grade:          p.grades?.label || p.role,
          badge:          p.badge_number || '',
          total_services: mine.length,
          total_minutes:  minutes,
          hours:          `${h}h${String(m).padStart(2,'0')}`,
          hourly_rate:    p.hourly_rate,
          phone:          p.phone_number || '',
          salary
        }
      })
      .filter(e => e.total_services > 0)
      .sort((a, b) => b.salary - a.salary)

    const totalPayroll   = salaries.reduce((a, e) => a + e.salary, 0)
    const totalMinAll    = salaries.reduce((a, e) => a + e.total_minutes, 0)
    const totalHours     = `${Math.floor(totalMinAll / 60)}h${String(totalMinAll % 60).padStart(2,'0')}`
    const fmtMoney       = (n) => n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // ── Embed Discord ──────────────────────────────────────
    const fields = salaries.slice(0, 24).map(e => ({
      name:   `${e.full_name}${e.badge ? ` · #${e.badge}` : ''}`,
      value:  [
        e.grade,
        `${e.total_services} service(s) · ${e.hours}`,
        e.phone ? `📞 ${e.phone}` : '',
        `**💰 ${fmtMoney(e.salary)} $**`
      ].filter(Boolean).join('\n'),
      inline: true
    }))

    if (salaries.length > 24) {
      fields.push({
        name:   `+ ${salaries.length - 24} autres`,
        value:  'Voir le tableau de bord pour le détail.',
        inline: false
      })
    }

    const embed = {
      title:       '📋  Récapitulatif des salaires — Delta Security',
      description: salaries.length > 0
        ? `**Semaine du ${weekLabel}**`
        : `**Semaine du ${weekLabel}**\n\n*Aucun service enregistré cette semaine.*`,
      color:  0xB8C4D0,
      fields,
      footer: {
        text: `${salaries.length} employé(s) · ${totalHours} · Masse salariale : ${fmtMoney(totalPayroll)} $`
      },
      timestamp: new Date().toISOString()
    }

    // ── Envoi Discord ──────────────────────────────────────
    const discordRes = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ embeds: [embed] })
    })

    if (!discordRes.ok) {
      throw new Error(`Discord ${discordRes.status}: ${await discordRes.text()}`)
    }

    return json({
      success:        true,
      week:           weekLabel,
      employees_paid: salaries.length,
      total_payroll:  totalPayroll
    })

  } catch (err) {
    console.error('weekly-recap:', err)
    return json({ error: err.message }, 500)
  }
})
