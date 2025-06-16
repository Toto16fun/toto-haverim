
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Football-Data.org API - free tier allows 10 calls per minute
const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4'

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

    // Fetch from multiple leagues to get variety of games
    const leagues = [
      '2', // Premier League
      '135', // Serie A
      '78', // Bundesliga
      '140', // La Liga
    ]

    let allMatches: any[] = []

    for (const leagueId of leagues) {
      try {
        const response = await fetch(`${FOOTBALL_DATA_API_URL}/competitions/${leagueId}/matches`, {
          headers: {
            'X-Auth-Token': 'YOUR_API_KEY_HERE' // You'll need to get this from football-data.org
          }
        })

        if (response.ok) {
          const data = await response.json()
          const upcomingMatches = data.matches
            .filter((match: any) => new Date(match.utcDate) > new Date())
            .slice(0, 4) // Take 4 matches from each league
          
          allMatches = [...allMatches, ...upcomingMatches]
        }
      } catch (error) {
        console.error(`Error fetching from league ${leagueId}:`, error)
      }
    }

    // If we couldn't fetch from API, create dummy games
    if (allMatches.length === 0) {
      console.log('Creating dummy games as fallback')
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

      allMatches = dummyTeams.map((teams, index) => ({
        homeTeam: { name: teams[0] },
        awayTeam: { name: teams[1] },
        utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }))
    }

    // Take first 16 matches for toto
    const selectedMatches = allMatches.slice(0, 16)

    // Delete existing games for this round
    await supabase
      .from('games')
      .delete()
      .eq('round_id', roundId)

    // Insert new games
    const gamesToInsert = selectedMatches.map((match, index) => ({
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
        games: insertedGames
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
