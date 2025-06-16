
import "https://deno.land/x/xhr@0.1.0/mod.ts"
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

    console.log('Auto-creating new Toto round...')

    // Get the latest round to determine the next round number
    const { data: latestRound, error: latestRoundError } = await supabase
      .from('toto_rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1)
      .single()

    let nextRoundNumber = 1
    if (latestRound && !latestRoundError) {
      nextRoundNumber = latestRound.round_number + 1
    }

    // Calculate dates for the new round
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() + 2) // Start date is Thursday (2 days after Tuesday)
    
    const deadline = new Date(startDate)
    deadline.setDate(startDate.getDate() + 3) // Deadline is Sunday at 19:00
    deadline.setHours(19, 0, 0, 0)

    console.log(`Creating round ${nextRoundNumber}`)

    // Create the new round
    const { data: newRound, error: createRoundError } = await supabase
      .from('toto_rounds')
      .insert({
        round_number: nextRoundNumber,
        start_date: startDate.toISOString().split('T')[0],
        deadline: deadline.toISOString()
      })
      .select()
      .single()

    if (createRoundError) {
      console.error('Error creating round:', createRoundError)
      return new Response(
        JSON.stringify({ error: 'Failed to create round', details: createRoundError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Round created successfully:', newRound)

    // Now fetch games for the new round
    console.log('Fetching games for the new round...')
    
    const { data: fetchGamesResult, error: fetchGamesError } = await supabase.functions.invoke('fetch-games', {
      body: { roundId: newRound.id }
    })

    if (fetchGamesError) {
      console.error('Error fetching games:', fetchGamesError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Round created but failed to fetch games',
          round: newRound,
          error: fetchGamesError 
        }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Games fetched successfully:', fetchGamesResult)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Round ${nextRoundNumber} created and games fetched automatically`,
        round: newRound,
        gamesResult: fetchGamesResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in auto-create-round function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
