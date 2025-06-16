
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting auto-create-round process...');

    // Get the current round number
    const { data: lastRound } = await supabase
      .from('toto_rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1)
      .single();

    const nextRoundNumber = (lastRound?.round_number || 0) + 1;
    console.log(`Creating round ${nextRoundNumber}`);

    // Calculate dates - round starts Thursday and deadline is Saturday 13:00 Israel time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days until next Thursday (round start)
    let daysUntilThursday = (4 - currentDay + 7) % 7;
    if (daysUntilThursday === 0 && now.getHours() >= 10) {
      daysUntilThursday = 7; // If it's Thursday and past 10 AM, schedule for next Thursday
    }
    
    const startDate = new Date();
    startDate.setDate(now.getDate() + daysUntilThursday);
    
    // Deadline is Saturday 13:00 Israel time (11:00 UTC considering daylight saving)
    const deadline = new Date(startDate);
    deadline.setDate(startDate.getDate() + 2); // Saturday after Thursday
    deadline.setUTCHours(10, 0, 0, 0); // 13:00 Israel time = 10:00 UTC (winter) / 11:00 UTC (summer)

    // Create the new round
    const { data: newRound, error: roundError } = await supabase
      .from('toto_rounds')
      .insert({
        round_number: nextRoundNumber,
        start_date: startDate.toISOString().split('T')[0],
        deadline: deadline.toISOString()
      })
      .select()
      .single();

    if (roundError) {
      console.error('Error creating round:', roundError);
      throw roundError;
    }

    console.log('Round created successfully:', newRound);

    // Fetch games using ChatGPT
    console.log('Fetching games from ChatGPT...');
    
    const { data: gamesResponse, error: gamesError } = await supabase.functions.invoke('fetch-games', {
      body: { 
        roundId: newRound.id,
        roundNumber: nextRoundNumber 
      }
    });

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      throw gamesError;
    }

    console.log('Games fetched successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        round: newRound,
        message: `Round ${nextRoundNumber} created successfully with games` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-create-round:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
