import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { roundId } = await req.json()
    
    if (!roundId) {
      throw new Error('Round ID is required')
    }

    console.log(`🧮 Computing scores for round: ${roundId}`)

    // 1. קבלת כל המשחקים והתוצאות הסופיות
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, result')
      .eq('round_id', roundId)
      .not('result', 'is', null)

    if (gamesError) {
      throw new Error(`Failed to fetch games: ${gamesError.message}`)
    }

    if (!games || games.length === 0) {
      throw new Error('No games with results found for this round')
    }

    console.log(`🎯 Found ${games.length} games with results`)

    // 2. קבלת כל הטפסים בסיבוב
    const { data: tickets, error: ticketsError } = await supabase
      .from('user_bets')
      .select('id, user_id')
      .eq('round_id', roundId)

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets: ${ticketsError.message}`)
    }

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets found for this round')
    }

    console.log(`🎫 Found ${tickets.length} tickets to score`)

    // 3. חישוב ניקוד לכל טופס
    const userScores = []

    for (const ticket of tickets) {
      let hits = 0

      // קבלת כל הניחושים של הטופס
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('match_id, pick')
        .eq('ticket_id', ticket.id)

      if (predictionsError) {
        console.error(`❌ Failed to fetch predictions for ticket ${ticket.id}:`, predictionsError)
        continue
      }

      // בדיקת כל משחק
      for (const game of games) {
        const gamePredictions = predictions?.filter(p => p.match_id === game.id) || []
        
        // בדיקה אם יש ניחוש נכון
        const hasCorrectPrediction = gamePredictions.some(p => p.pick === game.result)
        
        if (hasCorrectPrediction) {
          hits++
        }
      }

      userScores.push({
        round_id: roundId,
        user_id: ticket.user_id,
        hits: hits
      })

      console.log(`👤 User ${ticket.user_id}: ${hits} hits`)
    }

    // 4. מיון לפי ניקוד ומתן דירוג
    userScores.sort((a, b) => b.hits - a.hits)
    
    let currentRank = 1
    for (let i = 0; i < userScores.length; i++) {
      if (i > 0 && userScores[i].hits !== userScores[i-1].hits) {
        currentRank = i + 1
      }
      userScores[i].rank = currentRank
    }

    // 5. קביעת משלמים (המקום הראשון בלבד)
    const maxHits = userScores[0]?.hits || 0
    userScores.forEach(score => {
      score.is_payer = score.hits === maxHits
    })

    console.log(`🏆 Winners with ${maxHits} hits: ${userScores.filter(s => s.is_payer).length} users`)

    // 6. מחיקת ניקודים קודמים ועדכון חדשים
    const { error: deleteError } = await supabase
      .from('round_scores')
      .delete()
      .eq('round_id', roundId)

    if (deleteError) {
      console.error('❌ Failed to delete old scores:', deleteError)
    }

    const { error: insertError } = await supabase
      .from('round_scores')
      .insert(userScores)

    if (insertError) {
      throw new Error(`Failed to insert scores: ${insertError.message}`)
    }

    // 7. עדכון סטטוס הסיבוב לסיום
    const { error: updateError } = await supabase
      .from('toto_rounds')
      .update({ status: 'finished' })
      .eq('id', roundId)

    if (updateError) {
      console.error('❌ Failed to update round status:', updateError)
    }

    console.log(`✅ Scores computed successfully for round ${roundId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scores computed for round ${roundId}`,
        totalTickets: tickets.length,
        maxHits: maxHits,
        winnersCount: userScores.filter(s => s.is_payer).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in computeRoundScores function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})