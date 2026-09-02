import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Generates a witty Hebrew round summary with Lovable AI and sends it to Telegram.
//
// Body:
//   { roundId?: string, dryRun?: boolean, getChatId?: boolean, chatId?: string }
// - getChatId: true  -> returns recent bot updates so we can discover the chat id.
// - roundId omitted  -> picks the latest finished round that hasn't been summarized yet.
// - dryRun: true     -> builds the summaries without sending to Telegram.

const TELEGRAM_API = 'https://api.telegram.org'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const body = await req.json().catch(() => ({}))
    const { roundId, dryRun = false, getChatId = false } = body
    let chatId: string | undefined = body.chatId ?? Deno.env.get('TELEGRAM_CHAT_ID') ?? undefined

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!botToken) return json({ error: 'Missing TELEGRAM_BOT_TOKEN' }, 500)
    if (!lovableKey) return json({ error: 'Missing LOVABLE_API_KEY' }, 500)

    const tg = async (method: string, payload: Record<string, unknown>) => {
      const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.ok) {
        console.error(`Telegram ${method} failed:`, data)
        throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`)
      }
      return data.result
    }

    // Discovery mode: return recent updates so the user can find their chat id
    if (getChatId) {
      const updates = await tg('getUpdates', {})
      const chats = (updates ?? [])
        .map((u: any) => u.message?.chat ?? u.my_chat_member?.chat)
        .filter(Boolean)
        .map((c: any) => ({ id: c.id, type: c.type, title: c.title, first_name: c.first_name }))
      const unique = Array.from(new Map(chats.map((c: any) => [c.id, c])).values())
      return json({ ok: true, chats: unique })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Resolve the round
    let round: { id: string; round_number: number } | null = null
    if (roundId) {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number')
        .eq('id', roundId)
        .single()
      if (error || !data) return json({ error: 'Round not found' }, 404)
      round = data
    } else {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number')
        .eq('status', 'finished')
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) return json({ error: error.message }, 500)
      if (!data) return json({ ok: true, message: 'No finished round found', sent: 0 })
      round = data
    }

    // Idempotency: don't summarize the same round twice (unless dryRun)
    if (!dryRun) {
      const { data: existing } = await supabase
        .from('round_summaries')
        .select('id')
        .eq('round_id', round.id)
        .maybeSingle()
      if (existing) {
        return json({ ok: true, message: 'Summary already sent for this round', sent: 0, roundId: round.id })
      }
    }

    // 2. Games with results
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, game_number, home_team, away_team, result, is_cancelled')
      .eq('round_id', round.id)
      .order('game_number', { ascending: true })
    if (gamesError) return json({ error: gamesError.message }, 500)
    if (!games?.length) return json({ error: 'No games in round' }, 400)

    // 3. Leagues participating in this round (via round_scores)
    const { data: scoreRows, error: scoresError } = await supabase
      .from('round_scores')
      .select('league_id, user_id, points, rank')
      .eq('round_id', round.id)
      .order('points', { ascending: false })
    if (scoresError) return json({ error: scoresError.message }, 500)
    if (!scoreRows?.length) return json({ ok: true, message: 'No scores for round', sent: 0 })

    const leagueIds = [...new Set(scoreRows.map((s) => s.league_id))]
    const { data: leagues } = await supabase.from('leagues').select('id, name').in('id', leagueIds)
    const leagueName = (id: string) => leagues?.find((l) => l.id === id)?.name ?? 'ליגה'

    const userIds = [...new Set(scoreRows.map((s) => s.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds)
    const userName = (id: string) => profiles?.find((p) => p.id === id)?.name ?? 'משתמש'

    // 4. Bets + predictions for hit counts and spicy commentary
    const { data: bets } = await supabase
      .from('user_bets')
      .select('id, user_id, league_id')
      .eq('round_id', round.id)
    const betIds = (bets ?? []).map((b) => b.id)
    const { data: predictions } = betIds.length
      ? await supabase
          .from('bet_predictions')
          .select('bet_id, game_id, predictions, is_double')
          .in('bet_id', betIds)
      : { data: [] }

    const finishedGames = games.filter((g) => !g.is_cancelled && g.result)

    const perUser = new Map<string, { hits: number; doublesHit: number; doublesTotal: number }>()
    for (const bet of bets ?? []) {
      let hits = 0
      let doublesHit = 0
      let doublesTotal = 0
      for (const pred of (predictions ?? []).filter((p) => p.bet_id === bet.id)) {
        const game = finishedGames.find((g) => g.id === pred.game_id)
        if (!game) continue
        const hit = (pred.predictions ?? []).includes(game.result!)
        if (hit) hits++
        if (pred.is_double) {
          doublesTotal++
          if (hit) doublesHit++
        }
      }
      perUser.set(bet.user_id, { hits, doublesHit, doublesTotal })
    }

    // 5. Build one summary per league
    const summaries: Array<{ leagueId: string; leagueName: string; text: string }> = []

    for (const leagueId of leagueIds) {
      const leagueScores = scoreRows
        .filter((s) => s.league_id === leagueId)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      if (!leagueScores.length) continue

      const standings = leagueScores.map((s, i) => ({
        place: i + 1,
        name: userName(s.user_id),
        points: s.points ?? 0,
        hits: perUser.get(s.user_id)?.hits ?? 0,
        doublesHit: perUser.get(s.user_id)?.doublesHit ?? 0,
        doublesTotal: perUser.get(s.user_id)?.doublesTotal ?? 0,
      }))

      const resultsLine = finishedGames
        .map((g) => `${g.game_number}. ${g.home_team}–${g.away_team}: ${g.result}`)
        .join('\n')

      const prompt = `אתה כתב ספורט סתלבטי ומצחיק של קבוצת חברים שמהמרים על טוטו 16. כתוב בעברית, קליל, עם הומור וצחוק על החשבון של המשתתפים — אבל בטעם טוב.

הנה נתוני מחזור ${round.round_number} בליגה "${leagueName(leagueId)}":

תוצאות המשחקים:
${resultsLine}

טבלת המחזור (מקום, שם, נקודות, פגיעות נכונות מתוך ${finishedGames.length}, כפולים שהצליחו):
${standings.map((s) => `${s.place}. ${s.name} — ${s.points} נק', ${s.hits} פגיעות, כפולים: ${s.doublesHit}/${s.doublesTotal}`).join('\n')}

כתוב סיכום מחזור קצר (עד 180 מילים) שכולל:
1. שורת פתיחה עם מספר המחזור.
2. מי ניצח את המחזור וכמה פגיעות היו לו — ומי המשלם/ים (מקום אחרון).
3. 2-3 הערות סתלבט על הימורים ספציפיים (למשל: מי פספס משחק "בטוח", מי הלך על כפול אמיץ ונשרף, הפתעות).
4. אימוג'ים במידה. בלי כותרות markdown, בלי # — טקסט זורם עם שורות.

החזר רק את טקסט הסיכום.`

      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!aiRes.ok) {
        const errText = await aiRes.text()
        console.error('AI gateway failed:', aiRes.status, errText)
        return json({ error: `AI gateway failed: ${aiRes.status}` }, 502)
      }
      const aiData = await aiRes.json()
      const text = (aiData?.choices?.[0]?.message?.content ?? '').trim()
      if (!text) return json({ error: 'AI returned empty summary' }, 502)

      summaries.push({ leagueId, leagueName: leagueName(leagueId), text })
    }

    if (dryRun) {
      return json({ dryRun: true, roundId: round.id, roundNumber: round.round_number, summaries })
    }

    // 6. Send to Telegram
    if (!chatId) {
      const updates = await tg('getUpdates', {})
      const chats = (updates ?? [])
        .map((u: any) => u.message?.chat ?? u.my_chat_member?.chat)
        .filter(Boolean)
      if (chats.length === 1) {
        chatId = String(chats[0].id)
      } else if (chats.length === 0) {
        return json({ error: 'No Telegram chat found — send a message to the bot first' }, 400)
      } else {
        return json({
          error: 'Multiple chats found — pass chatId explicitly',
          chats: chats.map((c: any) => ({ id: c.id, type: c.type, title: c.title, first_name: c.first_name })),
        }, 400)
      }
    }

    let sent = 0
    for (const s of summaries) {
      await tg('sendMessage', { chat_id: chatId, text: s.text })
      sent++
    }

    // 7. Mark as sent
    await supabase.from('round_summaries').insert({
      round_id: round.id,
      chat_id: chatId,
      summaries,
    })

    return json({ success: true, roundId: round.id, roundNumber: round.round_number, sent, chatId })
  } catch (error) {
    console.error('Error in round-summary-telegram:', error)
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
