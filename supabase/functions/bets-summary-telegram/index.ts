import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Sends a short, funny Hebrew "bets recap" to Telegram right after a round locks.
// Highlights only the interesting bits: unique picks, X-lovers, totomats, doubles.
//
// Body:
//   { roundId?: string, dryRun?: boolean, chatId?: string }
// - roundId omitted -> picks the latest locked round that hasn't been recapped yet.
// - dryRun: true -> builds the message without sending to Telegram.

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
    const { roundId, dryRun = false } = body
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
        .in('status', ['locked', 'finished'])
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) return json({ error: error.message }, 500)
      if (!data) return json({ ok: true, message: 'No locked round found', sent: 0 })
      round = data
    }

    // Idempotency: don't recap the same round twice (unless dryRun)
    if (!dryRun) {
      const { data: existing } = await supabase
        .from('bets_summaries')
        .select('id')
        .eq('round_id', round.id)
        .maybeSingle()
      if (existing) {
        return json({ ok: true, message: 'Bets recap already sent for this round', sent: 0, roundId: round.id })
      }
    }

    // 2. Games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, game_number, home_team, away_team')
      .eq('round_id', round.id)
      .order('game_number', { ascending: true })
    if (gamesError) return json({ error: gamesError.message }, 500)
    if (!games?.length) return json({ error: 'No games in round' }, 400)

    // 3. Bets + predictions
    const { data: bets } = await supabase
      .from('user_bets')
      .select('id, user_id, is_autofilled')
      .eq('round_id', round.id)
    if (!bets?.length) return json({ ok: true, message: 'No bets for round', sent: 0 })

    const betIds = bets.map((b) => b.id)
    const { data: predictions } = await supabase
      .from('bet_predictions')
      .select('bet_id, game_id, predictions, is_double')
      .in('bet_id', betIds)

    const userIds = [...new Set(bets.map((b) => b.user_id).filter(Boolean))] as string[]
    const { data: profiles } = await supabase.from('profiles').select('id, name, league_id').in('id', userIds)
    const userName = (id: string) => profiles?.find((p) => p.id === id)?.name ?? 'משתמש'
    const userLeague = (id: string) => profiles?.find((p) => p.id === id)?.league_id ?? null

    const leagueIds = [...new Set(profiles?.map((p) => p.league_id).filter(Boolean) ?? [])] as string[]
    const { data: leagues } = leagueIds.length
      ? await supabase.from('leagues').select('id, name').in('id', leagueIds)
      : { data: [] }
    const leagueName = (id: string) => leagues?.find((l) => l.id === id)?.name ?? 'ליגה'

    // 4. Build one recap per league
    const summaries: Array<{ leagueId: string; leagueName: string; text: string }> = []

    for (const leagueId of leagueIds) {
      const leagueUserIds = userIds.filter((id) => userLeague(id) === leagueId)
      const leagueBets = bets.filter((b) => b.user_id && leagueUserIds.includes(b.user_id))
      if (!leagueBets.length) continue

      // Per-game: who picked each outcome (exact pick list)
      const gamesBreakdown = games
        .map((g) => {
          const lines = leagueBets.map((b) => {
            const pred = (predictions ?? []).find((p) => p.bet_id === b.id && p.game_id === g.id)
            if (!pred) return `${userName(b.user_id!)}: לא הימר`
            return `${userName(b.user_id!)}: ${(pred.predictions ?? []).join('/')}${pred.is_double ? ' (כפול)' : ''}`
          })
          return `משחק ${g.game_number}: ${g.home_team} נגד ${g.away_team} | ${lines.join(' | ')}`
        })
        .join('\n')

      // Computed interesting facts (server-side, 100% accurate) to ground the AI
      const facts: string[] = []

      // Per user: counts of 1/X/2, doubles, autofilled
      const userStats: string[] = []
      for (const b of leagueBets) {
        const preds = (predictions ?? []).filter((p) => p.bet_id === b.id)
        const singles = preds.filter((p) => !p.is_double)
        const c1 = singles.filter((p) => (p.predictions ?? []).includes('1')).length
        const cX = singles.filter((p) => (p.predictions ?? []).includes('X')).length
        const c2 = singles.filter((p) => (p.predictions ?? []).includes('2')).length
        const doubles = preds.filter((p) => p.is_double).length
        userStats.push(
          `${userName(b.user_id!)}: ${preds.length} משחקים סומנו (${c1} פעמים 1, ${cX} פעמים X, ${c2} פעמים 2), ${doubles} כפולים${b.is_autofilled ? ', הטור מולא אוטומטית (טוטומט)' : ''}`,
        )
      }

      // Unique picks: per game, outcomes picked by exactly one person
      for (const g of games) {
        const pickers: Record<string, string[]> = { '1': [], X: [], '2': [] }
        for (const b of leagueBets) {
          const pred = (predictions ?? []).find((p) => p.bet_id === b.id && p.game_id === g.id)
          for (const sign of pred?.predictions ?? []) {
            pickers[sign]?.push(userName(b.user_id!))
          }
        }
        for (const sign of ['1', 'X', '2'] as const) {
          if (pickers[sign].length === 1) {
            const desc = sign === '1' ? `ניצחון ${g.home_team}` : sign === '2' ? `ניצחון ${g.away_team}` : 'תיקו'
            facts.push(`${pickers[sign][0]} הוא היחיד שהלך על ${desc} במשחק ${g.game_number} (${g.home_team} נגד ${g.away_team})`)
          }
        }
      }

      const prompt = `אתה כתב ספורט סתלבטי ומצחיק של קבוצת חברים שמהמרים על טוטו 16. כתוב בעברית, קליל, עם הומור — בטעם טוב.

חוקי דיוק — קריטי, אסור לחרוג:
- מותר להסתמך אך ורק על הנתונים המופיעים למטה. אין להמציא בחירות, משחקים או שמות.
- "1" = ניצחון קבוצת הבית, "X" = תיקו, "2" = ניצחון קבוצת החוץ. אל תהפוך בין בית לחוץ.
- לפני טענה כמו "רק X הימר" — בדוק בפירוט ובעובדות המחושבות למטה שזה נכון.
- אין להוסיף מידע חיצוני על הקבוצות (טבלה, פציעות, מאמנים) — אתה לא יודע אותו.
- אם אינך בטוח בעובדה — אל תכתוב אותה.

רקע על המשתתפים — להשתמש בחוכמה ובמידה, רק כשיש חיבור טבעי. לא לכפות בדיחה:

כצמן: בעיות התנהגות, חי לפי החוקים של עצמו. נוטה לשלוח טוטומט כי לא שולח בזמן, לרוב בגלל שמירת שבת. מהמר כפייתי שמפסיד המון. עוד לא התאושש מ-15/16 שהוחמץ לפני 4 שנים.
ניב עובדיה: ממציאן אמיתי, המון הפתעות. מנטליות של הפועל — אוהב אנדרדוגים.
אורי לרנר: מלך האיקסים הבלתי מעורער. כינוי בילדות: "צ'וצ'ו". מאמין שאפשר להביא 16/16.
עידן: הרואה ואינו נראה. רכש חדש.
עילאי: אוהד מכבי ת"א שרוף, אוהב פרמייר ליג. לפעמים הגיוני מדי.
דניאל: חציל וחייזר. מחזיק שיא הקבוצה 15/16. עובד בוויקס שנים רבות, חיים נשענים על וויקס ועל אשתו מיכל.
תומר: הקפטן הבלתי מעורער. יציב אבל אפרורי. אוהד טוטנהאם ומכבי ת"א, חולה פרמייר ליג. שולח טפסים מהשירותים בבוקר.

מחזור ${round.round_number} ננעל! כל הטורים הוגשו בליגה "${leagueName(leagueId)}". הנה מה שכולם הימרו:

סטטיסטיקות למשתתף:
${userStats.join('\n')}

בחירות ייחודיות (רק אדם אחד הלך על זה):
${facts.length ? facts.join('\n') : 'אין — כולם הלכו באותו כיוון בערך'}

פירוט מלא של כל ההימורים:
${gamesBreakdown}

כתוב הודעת "הטורים ננעלו" קצרה וקלילה (עד 120 מילים) שכוללת:
1. שורת פתיחה קצרה שהמחזור ננעל.
2. רק את הדברים המעניינים באמת: בחירות ייחודיות של אדם אחד, מי שם מלא איקסים, מי שלח טוטומט (מולא אוטומטית), כפולים מעניינים — הכל מבוסס אך ורק על הנתונים למעלה.
3. אם יש חיבור טבעי לרקע של מישהו (איקסים לאורי, טוטומט לכצמן, אנדרדוגים לניב וכו') — השתמש בו בעדינות. אחרת אל תכריח.
4. אימוג'ים במידה. בלי כותרות markdown, בלי #. טקסט זורם וקצר — לא חופר.

החזר רק את טקסט ההודעה.`

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
      if (!text) return json({ error: 'AI returned empty recap' }, 502)

      summaries.push({ leagueId, leagueName: leagueName(leagueId), text })
    }

    if (!summaries.length) return json({ ok: true, message: 'Nothing to recap', sent: 0 })

    if (dryRun) {
      return json({ dryRun: true, roundId: round.id, roundNumber: round.round_number, summaries })
    }

    // 5. Send to Telegram
    if (!chatId) return json({ error: 'Missing TELEGRAM_CHAT_ID' }, 500)

    let sent = 0
    for (const s of summaries) {
      await tg('sendMessage', { chat_id: chatId, text: s.text })
      sent++
    }

    // 6. Mark as sent
    await supabase.from('bets_summaries').insert({
      round_id: round.id,
      chat_id: chatId,
      summaries,
    })

    return json({ success: true, roundId: round.id, roundNumber: round.round_number, sent, chatId })
  } catch (error) {
    console.error('Error in bets-summary-telegram:', error)
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
