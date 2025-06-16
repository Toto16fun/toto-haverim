
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { roundId } = await req.json()
    
    if (!roundId) {
      return new Response(
        JSON.stringify({ error: 'Round ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching games for round:', roundId)

    // Get current round info
    const { data: round, error: roundError } = await supabase
      .from('toto_rounds')
      .select('*')
      .eq('id', roundId)
      .single()

    if (roundError || !round) {
      console.error('Round not found:', roundError)
      return new Response(
        JSON.stringify({ error: 'Round not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let gamesData: any[] = []

    // Try to scrape from Winner website
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    
    if (firecrawlApiKey) {
      try {
        console.log('Scraping Winner website for games data')
        
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.winner.co.il/משחקים/וויננר-16/רגיל',
            formats: ['markdown', 'html']
          })
        })

        if (firecrawlResponse.ok) {
          const scraped = await firecrawlResponse.json()
          console.log('Successfully scraped Winner website')
          
          // Extract games from the scraped content
          const content = scraped.data?.markdown || scraped.data?.html || ''
          
          // Parse the content to extract game information
          // Look for patterns like "Team A vs Team B" or "Team A נגד Team B"
          const gamePatterns = [
            /([א-ת\w\s]+)\s*נגד\s*([א-ת\w\s]+)/g,
            /([א-ת\w\s]+)\s*vs\s*([א-ת\w\s]+)/gi,
            /([א-ת\w\s]+)\s*-\s*([א-ת\w\s]+)/g
          ]
          
          const foundGames: { homeTeam: string, awayTeam: string }[] = []
          
          for (const pattern of gamePatterns) {
            let match
            while ((match = pattern.exec(content)) !== null && foundGames.length < 16) {
              const homeTeam = match[1].trim()
              const awayTeam = match[2].trim()
              
              // Filter out very short or invalid team names
              if (homeTeam.length > 2 && awayTeam.length > 2 && homeTeam !== awayTeam) {
                foundGames.push({ homeTeam, awayTeam })
              }
            }
            if (foundGames.length >= 16) break
          }
          
          // If we found games, use them
          if (foundGames.length > 0) {
            gamesData = foundGames.slice(0, 16).map((game, index) => ({
              homeTeam: { name: game.homeTeam },
              awayTeam: { name: game.awayTeam },
              utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
            }))
            console.log(`Extracted ${gamesData.length} games from Winner website`)
          }
        } else {
          console.error('Failed to scrape Winner website:', firecrawlResponse.status)
        }
      } catch (error) {
        console.error('Error scraping Winner website:', error)
      }
    }

    // If we couldn't scrape or didn't find games, use dummy data as fallback
    if (gamesData.length === 0) {
      console.log('Using dummy games as fallback')
      const dummyTeams = [
        ['מנצ\'סטר יונייטד', 'ליברפול'],
        ['ברצלונה', 'ריאל מדריד'],
        ['באיירן מינכן', 'דורטמונד'],
        ['יובנטוס', 'מילאן'],
        ['פ.ס.ז', 'מרסיי'],
        ['צ\'לסי', 'ארסנל'],
        ['מנצ\'סטר סיטי', 'טוטנהאם'],
        ['אינטר', 'נאפולי'],
        ['אתלטיקו מדריד', 'ולנסיה'],
        ['ליברקוזן', 'לייפציג'],
        ['בנפיקה', 'פורטו'],
        ['אייאקס', 'PSV'],
        ['סלטיק', 'רינג\'רס'],
        ['גלטסראיי', 'פנרבחצ\'ה'],
        ['דינמו קייב', 'שחטר'],
        ['ספרטק מוסקבה', 'CSKA מוסקבה']
      ]

      gamesData = dummyTeams.map((teams, index) => ({
        homeTeam: { name: teams[0] },
        awayTeam: { name: teams[1] },
        utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }))
    }

    // Delete existing games for this round
    await supabase
      .from('games')
      .delete()
      .eq('round_id', roundId)

    // Insert new games
    const gamesToInsert = gamesData.slice(0, 16).map((match, index) => ({
      round_id: roundId,
      game_number: index + 1,
      home_team: match.homeTeam.name,
      away_team: match.awayTeam.name,
      game_date: match.utcDate
    }))

    const { data: insertedGames, error: insertError } = await supabase
      .from('games')
      .insert(gamesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting games:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert games' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully inserted ${insertedGames.length} games`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully fetched and inserted ${insertedGames.length} games`,
        games: insertedGames,
        source: gamesData.length > 0 && firecrawlApiKey ? 'Winner website' : 'Dummy data'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-games function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
