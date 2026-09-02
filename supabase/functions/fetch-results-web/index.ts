import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Scrapes the Telesport Toto-16 page with Firecrawl and extracts live results
// (1 / X / 2) for finished games using Lovable AI, then updates the games table
// and recomputes round scores live.
//
// Body: { roundId?: string, dryRun?: boolean, url?: string }
// If roundId is omitted, picks the latest round that still has games without results.

const DEFAULT_URL = 'https://www.telesport.co.il/%D7%98%D7%95%D7%98%D7%95'

const normalize = (s: string) =>
  (s ?? '')
    .replace(/["'״׳`.,\-–—()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

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
    const { roundId, dryRun = false, url = DEFAULT_URL } = body

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!firecrawlKey) return json({ error: 'Missing FIRECRAWL_API_KEY' }, 500)
    if (!lovableKey) return json({ error: 'Missing LOVABLE_API_KEY' }, 500)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Resolve the round
    let round: { id: string; round_number: number; status: string } | null = null
    if (roundId) {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number, status')
        .eq('id', roundId)
        .single()
      if (error || !data) return json({ error: 'Round not found' }, 404)
      round = data
    } else {
      // Latest round (active/locked/finished) that still has games missing results
      const { data: rounds, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number, status')
        .in('status', ['active', 'locked', 'finished'])
        .order('round_number', { ascending: false })
        .limit(5)
      if (error) return json({ error: error.message }, 500)

      for (const r of rounds ?? []) {
        const { count } = await supabase
          .from('games')
          .select('id', { count: 'exact', head: true })
          .eq('round_id', r.id)
          .is('result', null)
          .eq('is_cancelled', false)
        if ((count ?? 0) > 0) {
          round = r
          break
        }
      }
      if (!round) {
        return json({ success: true, message: 'No round with missing results', updated: 0 })
      }
    }

    // 2. Load the round's games
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, game_number, home_team, away_team, result, is_cancelled')
      .eq('round_id', round.id)
      .order('game_number', { ascending: true })
    if (gamesError) return json({ error: gamesError.message }, 500)
    if (!games || games.length === 0) return json({ error: 'No games in round' }, 400)

    // 3. Scrape the toto page
    console.log('Scraping', url)
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    })
    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text()
      console.error('Firecrawl failed:', scrapeRes.status, errText)
      return json({ error: `Firecrawl failed: ${scrapeRes.status}`, details: errText }, 502)
    }
    const scrapeData = await scrapeRes.json()
    const markdown: string = scrapeData?.data?.markdown ?? scrapeData?.markdown ?? ''
    if (!markdown || markdown.length < 50) {
      return json({ error: 'Scrape returned empty content' }, 502)
    }

    // 4. Extract live results with Lovable AI — only the "ווינר 16" section
    const prompt = `זהו תוכן של עמוד טוטו באתר טלספורט. התמקד אך ורק בטבלה תחת הכותרת "ווינר 16" (התעלם מ"ווינר מחצית" ו"ווינר עולמי").
עבור כל אחד מ-16 המשחקים בטבלת ווינר 16, חלץ:
- index: מספר המשחק (1-16)
- home: קבוצת הבית
- away: קבוצת החוץ
- finished: האם המשחק הסתיים (מסומן "הסתיים" או שיש תוצאה מספרית)
- result: אם המשחק הסתיים — "1" (ניצחון בית), "X" (תיקו) או "2" (ניצחון חוץ), לפי עמודת התוצאה בטבלה. אם לא הסתיים — null.

החזר JSON בלבד בפורמט:
{"games":[{"index":1,"home":"...","away":"...","finished":false,"result":null}]}
אל תמציא תוצאות. אם משחק לא הסתיים, finished=false ו-result=null.

תוכן העמוד:
${markdown.slice(0, 30000)}`

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })
    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('AI gateway failed:', aiRes.status, errText)
      return json({ error: `AI gateway failed: ${aiRes.status}` }, 502)
    }
    const aiData = await aiRes.json()
    const content = aiData?.choices?.[0]?.message?.content ?? '{}'

    let extracted: { games: Array<{ index: number; home: string; away: string; finished: boolean; result: string | null }> }
    try {
      extracted = JSON.parse(content)
    } catch {
      return json({ error: 'AI returned invalid JSON', raw: content.slice(0, 500) }, 502)
    }
    const scraped = extracted?.games ?? []

    // 5. Match scraped games to DB games by index + team names, update results
    const updates: Array<{ gameId: string; index: number; result: string; home: string; away: string }> = []
    const mismatches: Array<{ index: number; db: string; scraped: string }> = []

    for (const g of scraped) {
      if (!g.finished || !g.result || !['1', 'X', '2'].includes(g.result)) continue
      const dbGame = games.find((x) => x.game_number === g.index)
      if (!dbGame || dbGame.is_cancelled) continue
      if (dbGame.result) continue // already has a result

      const homeMatch =
        normalize(dbGame.home_team).includes(normalize(g.home)) ||
        normalize(g.home).includes(normalize(dbGame.home_team))
      const awayMatch =
        normalize(dbGame.away_team).includes(normalize(g.away)) ||
        normalize(g.away).includes(normalize(dbGame.away_team))

      if (!homeMatch || !awayMatch) {
        mismatches.push({
          index: g.index,
          db: `${dbGame.home_team} - ${dbGame.away_team}`,
          scraped: `${g.home} - ${g.away}`,
        })
        continue
      }
      updates.push({ gameId: dbGame.id, index: g.index, result: g.result, home: g.home, away: g.away })
    }

    if (dryRun) {
      return json({
        dryRun: true,
        roundId: round.id,
        roundNumber: round.round_number,
        updates,
        mismatches,
        scrapedCount: scraped.length,
      })
    }

    let updatedCount = 0
    for (const u of updates) {
      const { error } = await supabase
        .from('games')
        .update({ result: u.result, actual_result: u.result })
        .eq('id', u.gameId)
      if (error) {
        console.error(`Failed to update game ${u.gameId}:`, error)
      } else {
        updatedCount++
      }
    }

    // 6. Recompute live scores if anything changed
    let scoresComputed = false
    let roundFinished = false
    if (updatedCount > 0) {
      const { error: computeError } = await supabase.rpc('compute_round_scores_sql', {
        p_round_id: round.id,
      })
      if (computeError) {
        console.error('Score recompute failed:', computeError)
      } else {
        scoresComputed = true
      }

      // 7. If all non-cancelled games now have results, finalize the round
      const { count: remaining } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .eq('round_id', round.id)
        .is('result', null)
        .eq('is_cancelled', false)

      if ((remaining ?? 0) === 0) {
        const { error: finishError } = await supabase
          .from('toto_rounds')
          .update({ results_updated: true, status: 'finished' })
          .eq('id', round.id)
        if (finishError) {
          console.error('Failed to finalize round:', finishError)
        } else {
          roundFinished = true

          // Fire the Telegram round summary (only if a bot token is configured)
          if (Deno.env.get('TELEGRAM_BOT_TOKEN')) {
            try {
              const summaryRes = await fetch(
                new URL('/functions/v1/round-summary-telegram', Deno.env.get('SUPABASE_URL')!).toString(),
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ roundId: round.id }),
                },
              )
              if (!summaryRes.ok) {
                console.error('Summary function failed:', summaryRes.status, await summaryRes.text())
              } else {
                console.log('Round summary sent:', await summaryRes.text())
              }
            } catch (e) {
              console.error('Failed to call summary function:', e)
            }
          }
        }
      }
    }

    return json({
      success: true,
      roundId: round.id,
      roundNumber: round.round_number,
      updated: updatedCount,
      mismatches,
      scoresComputed,
      roundFinished,
    })
  } catch (error) {
    console.error('Error in fetch-results-web:', error)
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
