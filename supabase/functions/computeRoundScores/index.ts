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

    // ודא שכל המשחקים במחזור קיבלו result
    const { data: missing, error: missingError } = await supabase
      .from('games')
      .select('id')
      .eq('round_id', roundId)
      .is('result', null)

    if (missingError) {
      throw new Error(`Failed to check missing results: ${missingError.message}`)
    }

    if ((missing ?? []).length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'results missing', 
          remaining: missing?.length 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // לחשב hits → round_scores באמצעות הפונקציה החדשה
    const { error: computeError } = await supabase.rpc('compute_round_scores_sql', { 
      p_round_id: roundId 
    })
    
    if (computeError) {
      throw new Error(`Failed to compute scores: ${computeError.message}`)
    }

    console.log(`✅ Scores computed using SQL function`)

    // לזהות מינימום hits (משלמים) ולעדכן flag
    const { data: scores, error: scoresError } = await supabase
      .from('round_scores')
      .select('user_id, hits')
      .eq('round_id', roundId)

    if (scoresError) {
      throw new Error(`Failed to fetch scores: ${scoresError.message}`)
    }

    if (!scores || scores.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no scores' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const minHits = Math.min(...scores.map(s => s.hits))
    const payers = scores.filter(s => s.hits === minHits).map(s => s.user_id)

    // עדכון דירוג
    scores.sort((a, b) => b.hits - a.hits)
    let currentRank = 1
    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i].hits !== scores[i-1].hits) {
        currentRank = i + 1
      }
      
      const { error: rankError } = await supabase
        .from('round_scores')
        .update({ 
          rank: currentRank,
          is_payer: scores[i].hits === minHits
        })
        .eq('round_id', roundId)
        .eq('user_id', scores[i].user_id)

      if (rankError) {
        console.error(`❌ Failed to update rank for user ${scores[i].user_id}:`, rankError)
      }
    }

    // עדכון סטטוס הסיבוב לסיום
    const { error: updateError } = await supabase
      .from('toto_rounds')
      .update({ status: 'finished' })
      .eq('id', roundId)

    if (updateError) {
      console.error('❌ Failed to update round status:', updateError)
    }

    console.log(`💸 Payers with ${minHits} hits: ${payers.length} users`)
    console.log(`✅ Scores computed successfully for round ${roundId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scores computed for round ${roundId}`,
        totalTickets: scores.length,
        minHits: minHits,
        payersCount: payers.length
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