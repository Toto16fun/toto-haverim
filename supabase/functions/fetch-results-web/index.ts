import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Reads live Winner-16 results straight from bankerim.co.il's programme endpoint
// (the same AJAX call the site's own page makes), parses 1 / X / 2 for finished
// games deterministically, updates the games table and recomputes round scores.
//
// Body: { roundId?: string, dryRun?: boolean, date?: string (YYYY-MM-DD) }
// If roundId is omitted, picks the latest round that still has games without results.

const AJAX_URL = 'https://www.bankerim.co.il/php/ajaxHandller.php'
const GAME_TYPE = '96'

const normalize = (s: string) =>
  (s ?? '')
    .replace(/["'״׳`.,\-–—()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

type ScrapedGame = {
  index: number
  home: string
  away: string
  finished: boolean
  result: string | null
}

// Pull the programme HTML for a specific Saturday and parse each game row.
async function fetchProgramme(dateISO: string): Promise<{ games: ScrapedGame[]; programme: string | null; raw: number }> {
  const res = await fetch(`${AJAX_URL}?_=${Date.now()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      Referer: 'https://www.bankerim.co.il/',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
    },
    body: `myFunc=160&startTime=${dateISO}&logged=0&gameType=${GAME_TYPE}`,
  })
  if (!res.ok) throw new Error(`bankerim request failed: ${res.status}`)
  const html = await res.text()

  const programme = html.match(/data-info-roundid="(\d+)"/)?.[1] ?? null

  // Each game is a <div class="game ..."> block; split on that boundary.
  const blocks = html.split(/<div class="game /).slice(1)
  const games: ScrapedGame[] = []

  for (const block of blocks) {
    const index = Number(block.match(/data-num-in-round="(\d+)"/)?.[1] ?? 0)
    if (!index) continue

    const desc = block.match(/<span class="desc"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? ''
    const teams = desc.replace(/<[^>]+>/g, '').trim().split(' - ')
    const home = (teams[0] ?? '').trim()
    const away = (teams[1] ?? '').trim()

    // Status lives in the <span class="status">...</span> block only.
    const status = block.match(/<span class="status">([\s\S]*?)<\/span>\s*<\/span>/)?.[1] ?? ''
    const finished = status.includes('הסתיים')

    // The site marks the winning column with the "win" class.
    let result: string | null = null
    if (/class="bet-home\s+win"/.test(block)) result = '1'
    else if (/class="bet-x\s+win"/.test(block)) result = 'X'
    else if (/class="bet-guest\s+win"/.test(block)) result = '2'

    games.push({ index, home, away, finished, result: finished ? result : null })
  }

  // Keep only the 16 toto games, first occurrence per index.
  const seen = new Set<number>()
  const unique = games.filter((g) => (seen.has(g.index) ? false : (seen.add(g.index), true)))

  return { games: unique, programme, raw: blocks.length }
}

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
    const { roundId, dryRun = false, date } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Resolve the round
    let round: { id: string; round_number: number; status: string; deadline: string } | null = null
    if (roundId) {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number, status, deadline')
        .eq('id', roundId)
        .single()
      if (error || !data) return json({ error: 'Round not found' }, 404)
      round = data
    } else {
      const { data: rounds, error } = await supabase
        .from('toto_rounds')
        .select('id, round_number, status, deadline')
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

    // 3. Fetch the exact programme for this round (by its deadline date, Israel time)
    const programmeDate: string =
      date ??
      new Date(new Date(round.deadline).getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

    console.log(`Fetching bankerim programme for ${programmeDate} (round ${round.round_number})`)
    const { games: scraped, programme, raw } = await fetchProgramme(programmeDate)
    if (scraped.length === 0) {
      return json({ error: 'No games found on source page', programmeDate, raw }, 502)
    }

    // 4. Match scraped games to DB games by index + team names, update results
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
        programmeDate,
        programme,
        updates,
        mismatches,
        scrapedCount: scraped.length,
        scraped,
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

    // 5. Recompute live scores if anything changed
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

      // 6. If all non-cancelled games now have results, finalize the round
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
      programmeDate,
      programme,
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
