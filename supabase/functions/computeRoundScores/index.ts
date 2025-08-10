import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 
      { auth: { persistSession: false } }
    );

    const { roundId } = await req.json() as { roundId?: string };
    
    if (!roundId) {
      return new Response(JSON.stringify({ error: 'roundId required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🧮 Computing scores for round: ${roundId}`);

    // ודא שכל המשחקים במחזור קיבלו result
    const { data: missing } = await supabase
      .from('games')
      .select('id')
      .eq('round_id', roundId)
      .is('result', null);

    if ((missing ?? []).length > 0) {
      return new Response(JSON.stringify({ 
        error: 'results missing', 
        remaining: missing?.length 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎯 All games have results, computing scores...`);

    // לחשב hits → round_scores באמצעות הפונקציה החדשה
    const { error: computeError } = await supabase.rpc('compute_round_scores_sql', { 
      p_round_id: roundId 
    });

    if (computeError) {
      console.error('❌ Failed to compute scores:', computeError);
      throw computeError;
    }

    // לזהות מינימום hits (משלמים) ולעדכן flag
    const { data: scores, error: scoresError } = await supabase
      .from('round_scores')
      .select('user_id,hits')
      .eq('round_id', roundId);

    if (scoresError) throw scoresError;
    
    if (!scores || scores.length === 0) {
      return new Response(JSON.stringify({ error: 'no scores found' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const maxHits = Math.max(...scores.map(s => s.hits));
    const payers = scores.filter(s => s.hits === maxHits).map(s => s.user_id);

    console.log(`🏆 Max hits: ${maxHits}, Winners: ${payers.length} users`);

    // איפוס כל הדגלים קודם
    await supabase
      .from('round_scores')
      .update({ is_payer: false })
      .eq('round_id', roundId);

    // עדכון המשלמים
    for (const uid of payers) {
      await supabase
        .from('round_scores')
        .update({ is_payer: true })
        .eq('round_id', roundId)
        .eq('user_id', uid);
    }

    // עדכון סטטוס הסיבוב לסיום
    const { error: updateError } = await supabase
      .from('toto_rounds')
      .update({ status: 'finished' })
      .eq('id', roundId);

    if (updateError) {
      console.error('❌ Failed to update round status:', updateError);
    }

    console.log(`✅ Scores computed successfully for round ${roundId}`);

    return new Response(JSON.stringify({ 
      ok: true, 
      roundId, 
      payers: payers.length,
      maxHits,
      totalPlayers: scores.length
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Error in computeRoundScores function:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});