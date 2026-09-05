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

    // 3. Scores for this round (league comes from profiles)
    const { data: scoreRows, error: scoresError } = await supabase
      .from('round_scores')
      .select('user_id, hits, rank, is_payer')
      .eq('round_id', round.id)
      .order('hits', { ascending: false })
    if (scoresError) return json({ error: scoresError.message }, 500)
    if (!scoreRows?.length) return json({ ok: true, message: 'No scores for round', sent: 0 })

    const userIds = [...new Set(scoreRows.map((s) => s.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, name, league_id').in('id', userIds)
    const userName = (id: string) => profiles?.find((p) => p.id === id)?.name ?? 'משתמש'
    const userLeague = (id: string) => profiles?.find((p) => p.id === id)?.league_id ?? null

    // Only summarize the main (first-created) league; skip secondary leagues like "ilay express"
    const { data: mainLeague } = await supabase
      .from('leagues')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    if (!mainLeague) return json({ ok: true, message: 'No main league found', sent: 0 })

    const leagueIds = [mainLeague.id] as string[]
    const { data: leagues } = await supabase.from('leagues').select('id, name').eq('id', mainLeague.id)
    const leagueName = (id: string) => leagues?.find((l) => l.id === id)?.name ?? 'ליגה'

    // 4. Bets + predictions for hit counts and spicy commentary
    const { data: bets } = await supabase
      .from('user_bets')
      .select('id, user_id')
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
        .filter((s) => userLeague(s.user_id) === leagueId)
        .sort((a, b) => (b.hits ?? 0) - (a.hits ?? 0))
      if (!leagueScores.length) continue

      const standings = leagueScores.map((s, i) => ({
        place: i + 1,
        name: userName(s.user_id),
        points: s.hits ?? 0,
        hits: perUser.get(s.user_id)?.hits ?? s.hits ?? 0,
        doublesHit: perUser.get(s.user_id)?.doublesHit ?? 0,
        doublesTotal: perUser.get(s.user_id)?.doublesTotal ?? 0,
        isPayer: s.is_payer ?? false,
      }))

      const leagueUserIds = leagueScores.map((s) => s.user_id)
      const leagueBets = (bets ?? []).filter((b) => leagueUserIds.includes(b.user_id))

      const resultWord = (g: { home_team: string; away_team: string; result: string | null }) => {
        if (g.result === '1') return `ניצחון בית — ${g.home_team} ניצחה`
        if (g.result === '2') return `ניצחון חוץ — ${g.away_team} ניצחה`
        if (g.result === 'X') return 'תיקו'
        return 'ללא תוצאה'
      }

      // Full per-game breakdown: result in words + exactly who predicted what
      const gamesBreakdown = finishedGames
        .map((g) => {
          const lines = leagueBets.map((b) => {
            const pred = (predictions ?? []).find((p) => p.bet_id === b.id && p.game_id === g.id)
            if (!pred) return `${userName(b.user_id)}: לא הימר`
            const picks = (pred.predictions ?? []).join('/')
            const hit = (pred.predictions ?? []).includes(g.result!)
            return `${userName(b.user_id)}: ${picks}${pred.is_double ? ' (כפול)' : ''} — ${hit ? 'פגע' : 'פספס'}`
          })
          return `משחק ${g.game_number}: ${g.home_team} נגד ${g.away_team} | תוצאה: ${g.result} = ${resultWord(g)}\n   ${lines.join(' | ')}`
        })
        .join('\n')

      const prompt = `אתה כתב ספורט סתלבטי ומצחיק של קבוצת חברים שמהמרים על טוטו 16. כתוב בעברית, קליל, עם הומור וצחוק על החשבון של המשתתפים — אבל בטעם טוב.

חוקי דיוק — קריטי, אסור לחרוג:
- מותר להסתמך אך ורק על הנתונים המופיעים למטה. אין להמציא תוצאות, שמות קבוצות, מגרשים, שערים או פרטי משחק.
- "1" = ניצחון קבוצת הבית, "X" = תיקו, "2" = ניצחון קבוצת החוץ. אל תהפוך בין בית לחוץ.
- לפני כל טענה על "מי הימר מה" — בדוק את פירוט המשחקים המופיע למטה. אל תכתוב "רק X הימר" אלא אם בפירות המשחק באמת רק X בחר את הבחירה הזאת.
- אין להוסיף מידע חיצוני על הקבוצות (טבלה, פציעות, מאמנים, היסטוריה) — אתה לא יודע אותו.
- אם אינך בטוח בעובדה — פשוט אל תכתוב אותה. עדיף לוותר על בדיחה מאשר להמציא פרטים.
- כל הנתונים למטה שייכים אך ורק למחזור ${round.round_number}. אסור להזכיר משחקים, קבוצות, בחירות או אירועים ממחזורים קודמים.
- כל שם קבוצה שאתה מזכיר חייב להופיע מילה במילה בפירוט המשחקים למטה.
- אין לטעון שמישהו שלח טוטומט/מילוי אוטומטי אלא אם זה כתוב במפורש בנתונים.

רקע על המשתתפים — להשתמש בחוכמה ובמידה, רק כשיש חיבור טבעי למה שקרה במחזור. לא בכל סיכום, ולא לכפות בדיחה שלא מתחברת:

כצמן: בעיות התנהגות קשות, חי לפי החוקים של עצמו. עוד לא התאושש מהטור הכמעט-מנצח של 15/16 לפני 4 שנים, שנפל במשחק האחרון של אום אל פאחם נגד בני יהודה (הטור של דניאל), שבו פספסנו 6 מיליון ש"ח וזכינו ב-6,000. טוען שניראון השוער מכר את המשחק. נוטה לשלוח טוטומט כי לא שולח בזמן, לרוב בגלל שמירת שבת. מהמר כפייתי שמפסיד המון.

ניב עובדיה: ממציאן אמיתי, המון הפתעות. מנטליות של הפועל — אוהב אנדרדוגים. נשמה ומצחיק מאוד.

אורי לרנר: מלך האיקסים הבלתי מעורער. רכש מבריק מהעונה שעברה, תשוקה ענקית לכדורגל. כינוי בילדות: "צ'וצ'ו". מאמין שאפשר להביא 16/16.

עידן: הרואה ואינו נראה. רכש חדש מהעונה.

עילאי: אוהד מכבי ת"א שרוף, אוהב מאוד כדורגל וצופה ברוב המשחקים. אוהב פרמייר ליג. לפעמים הגיוני מדי. הקים קבוצת טוטו מתחרה עם חברים אחרים אבל נשאר בקבוצה המקורית.

דניאל: חציל וחייזר. מחזיק בשיא הקבוצה 15/16, שנפל במשחק האחרון של אום אל פאחם נגד בני יהודה בדקה ה-82. יציב בשנתיים האחרונות אבל קצת אפור. עובד בוויקס שנים רבות מאוד, חיים נשענים על וויקס ועל אשתו מיכל.

תומר: הקפטן הבלתי מעורער, מחזיק את הקבוצה חיה ובועטת כבר שנים. יציב אבל אפרורי. אוהד טוטנהאם ומכבי תל אביב. חולה פרמייר ליג. נוטה לשלוח את הטפסים מהשירותים בקקי בוקר כי זה זמן הריכוז הטוב ביותר ביום.

נתוני מחזור ${round.round_number} בליגה "${leagueName(leagueId)}":

פירוט מלא של המשחקים וההימורים:
${gamesBreakdown}

טבלת המחזור (מקום, שם, נקודות, פגיעות נכונות מתוך ${finishedGames.length}, כפולים שהצליחו):
${standings.map((s) => `${s.place}. ${s.name} — ${s.points} נק', ${s.hits} פגיעות, כפולים: ${s.doublesHit}/${s.doublesTotal}`).join('\n')}

כתוב סיכום מחזור קצר שכולל:
1. שורת פתיחה עם מספר המחזור.
2. טבלת תוצאות מדורגת בפורמט הבא בדיוק — שורה לכל מקום, בלי שינויי נוסח: "ראשון - {שם} {פגיעות}/${finishedGames.length}", "שני - {שם} {פגיעות}/${finishedGames.length}", "שלישי - ...". אם יש שוויון באותו מקום, צרף שמות באותה שורה (למשל: "שני - תומר ועילאי 7/16").
3. מי ניצח את המחזור — ומי המשלם/ים (מקום אחרון).
4. 2-3 הערות סתלבט על הימורים ספציפיים, כולן מבוססות ישירות על הפירוט למעלה. אם יש חיבור טבעי לרקע של מישהו (למשל: המון איקסים לאורי, טוטומט לכצמן, הפועל/אנדרדוג לניב, מכבי ת"א לעילאי, טוטנהאם/פרמייר ליג לתומר, וויקס/מיכל לדניאל) — השתמש בו. אחרת, אל תכריח אותו.
5. אימוג'ים במידה. בלי כותרות markdown, בלי # — טקסט זורם עם שורות. עד 220 מילים.

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
