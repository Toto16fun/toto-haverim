import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Scrapes the Toto-16 fixtures page with Firecrawl and extracts the 16 games
// using Lovable AI. Supports dryRun=true to preview extraction without writing.
//
// Body: { roundId?: string, dryRun?: boolean, url?: string }

const DEFAULT_URL = 'https://www.toto.org.il/lines-toto'

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
    const { roundId, dryRun = false, url = DEFAULT_URL } = await req.json()

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!firecrawlKey) return json({ error: 'Missing FIRECRAWL_API_KEY' }, 500)
    if (!lovableKey) return json({ error: 'Missing LOVABLE_API_KEY' }, 500)

    // 1. Scrape the fixtures page
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
      return json({ error: 'Scrape returned empty content', raw: scrapeData }, 502)
    }
    console.log('Scraped markdown length:', markdown.length)

    // 2. Extract the 16 games with Lovable AI
    const prompt = `זהו תוכן של עמוד טוטו 16. חלץ ממנו את רשימת 16 המשחקים של המחזור.
החזר JSON בלבד בפורמט הבא, בלי טקסט נוסף:
{"games":[{"index":1,"home":"קבוצת בית","away":"קבוצת חוץ","league":"ליגה או ריק"}]}
כללים:
- בדיוק 16 משחקים, ממוספרים 1 עד 16 לפי הסדר בעמוד.
- הקבוצה הראשונה היא קבוצת הבית, השנייה קבוצת החוץ.
- אל תמציא שמות קבוצות. אם אין 16 משחקים בעמוד, החזר רק את מה שנמצא.

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
      return json({ error: `AI gateway failed: ${aiRes.status}`, details: errText }, 502)
    }

    const aiData = await aiRes.json()
    const content: string = aiData?.choices?.[0]?.message?.content ?? ''
    console.log('AI response length:', content.length)

    let games: Array<{ index: number; home: string; away: string; league?: string }> = []
    try {
      const match = content.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match ? match[0] : content)
      if (Array.isArray(parsed.games)) {
        games = parsed.games
          .filter((g: any) => g && typeof g.home === 'string' && typeof g.away === 'string'
            && g.home.trim() && g.away.trim())
          .slice(0, 16)
          .map((g: any, i: number) => ({
            index: i + 1,
            home: String(g.home).trim(),
            away: String(g.away).trim(),
            league: g.league ? String(g.league).trim() : null,
          }))
      }
    } catch (e) {
      console.error('Failed to parse AI JSON:', e)
      return json({ error: 'Failed to parse AI response', raw: content.slice(0, 2000) }, 502)
    }

    if (games.length === 0) {
      return json({
        error: 'No games extracted from page',
        markdownPreview: markdown.slice(0, 2000),
      }, 502)
    }

    console.log('Extracted games:', games.length)

    if (dryRun || !roundId) {
      return json({ dryRun: true, games, source: url })
    }

    // 3. Write games into the round
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    await supabase.from('games').delete().eq('round_id', roundId)

    const rows = games.map((g) => ({
      round_id: roundId,
      game_number: g.index,
      home_team: g.home,
      away_team: g.away,
      league: g.league || null,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('games')
      .insert(rows)
      .select()

    if (insertError) {
      console.error('Insert failed:', insertError)
      return json({ error: 'Failed to insert games', details: insertError }, 500)
    }

    return json({ success: true, games: inserted, source: url })
  } catch (error: any) {
    console.error('fetch-games-web error:', error)
    return json({ error: 'Internal server error', details: error?.message }, 500)
  }
})
