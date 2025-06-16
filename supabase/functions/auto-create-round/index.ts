
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
    deadline.setUTCHours(10, 0, 0, 0); // 13:00 Israel time = 10:00 UTC (winter)

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

    // Try to fetch games using ChatGPT - but don't fail if it doesn't work
    console.log('Attempting to fetch games from ChatGPT...');
    
    try {
      const { data: gamesResponse, error: gamesError } = await supabase.functions.invoke('fetch-games', {
        body: { 
          roundId: newRound.id,
          roundNumber: nextRoundNumber 
        }
      });

      if (gamesError) {
        console.log('Games fetch failed, but round was created successfully:', gamesError);
        // Don't throw - round creation was successful even if games fetch failed
        return new Response(
          JSON.stringify({ 
            success: true, 
            round: newRound,
            message: `מחזור ${nextRoundNumber} נוצר בהצלחה. לא הצלחנו לשלוף משחקים אוטומטית - תוכל להוסיף אותם ידנית.`,
            gamesStatus: 'failed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Games fetched successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          round: newRound,
          message: `מחזור ${nextRoundNumber} נוצר בהצלחה עם משחקים`,
          gamesStatus: 'success'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (gamesFetchError) {
      console.log('Games fetch threw an error, but round was created successfully:', gamesFetchError);
      // Don't throw - round creation was successful even if games fetch failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          round: newRound,
          message: `מחזור ${nextRoundNumber} נוצר בהצלחה. לא הצלחנו לשלוף משחקים אוטומטית - תוכל להוסיף אותם ידנית.`,
          gamesStatus: 'failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
