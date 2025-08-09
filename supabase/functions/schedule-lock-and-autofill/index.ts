import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, 
  { auth: { persistSession: false } }
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running scheduled lock and autofill...');
    
    const now = new Date().toISOString();
    
    // Find active rounds that have passed their deadline
    const { data: rounds, error: roundsError } = await sb
      .from('toto_rounds')
      .select('id, round_number, deadline')
      .eq('status', 'active')
      .lte('deadline', now);
    
    if (roundsError) {
      console.error('Error fetching rounds to lock:', roundsError);
      throw roundsError;
    }

    const locked: Array<{id: string, roundNumber: number}> = [];

    for (const round of (rounds ?? [])) {
      console.log(`Locking round ${round.round_number} (ID: ${round.id})`);
      
      try {
        // Update round status to locked
        const { error: updateError } = await sb
          .from('toto_rounds')
          .update({ status: 'locked' })
          .eq('id', round.id);
        
        if (updateError) {
          console.error(`Error updating round ${round.id} status:`, updateError);
          continue; // Continue with other rounds even if one fails
        }

        // Call lockRound function to process the round
        const lockResponse = await fetch(
          new URL('/functions/v1/lockRound', Deno.env.get('SUPABASE_URL')!).toString(), 
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roundId: round.id })
          }
        );

        if (!lockResponse.ok) {
          console.error(`Failed to call lockRound for round ${round.id}:`, await lockResponse.text());
          // Continue with other rounds even if lockRound fails
        } else {
          console.log(`Successfully processed lockRound for round ${round.round_number}`);
        }

        locked.push({ id: round.id, roundNumber: round.round_number });
        
      } catch (roundError) {
        console.error(`Error processing round ${round.id}:`, roundError);
        // Continue with other rounds
      }
    }

    console.log(`Successfully locked ${locked.length} rounds`);
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        locked,
        totalProcessed: locked.length,
        timestamp: now
      }), 
      { headers: { ...corsHeaders, 'content-type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in schedule-lock-and-autofill function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }), 
      { status: 500, headers: corsHeaders }
    );
  }
});