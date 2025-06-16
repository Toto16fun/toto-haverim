
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

    // Now try to fetch games directly with OpenAI instead of calling fetch-games function
    console.log('Attempting to fetch games directly from OpenAI...');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.log('OpenAI API key not found, returning without games');
      return new Response(
        JSON.stringify({ 
          success: true, 
          round: newRound,
          message: `מחזור ${nextRoundNumber} נוצר בהצלחה. מפתח OpenAI לא נמצא - תוכל להוסיף משחקים ידנית.`,
          gamesStatus: 'no_api_key'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      console.log('Calling OpenAI API directly...');
      
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'תן לי רשימה של 16 המשחקים בטוטו 16 למחזור הקרוב. לפי סדר המשחקים המופיע בתוכנית הטוטו. החזר את התשובה בפורמט JSON עם המבנה הבא: {"games": [{"homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"}]} עם בדיוק 16 משחקים בעברית.'
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      console.log('OpenAI response status:', openAIResponse.status);

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json().catch(() => ({}));
        console.error('OpenAI API error:', openAIResponse.status, errorData);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            round: newRound,
            message: `מחזור ${nextRoundNumber} נוצר בהצלחה. שגיאה ב-OpenAI (${openAIResponse.status}) - תוכל להוסיף משחקים ידנית.`,
            gamesStatus: 'api_error',
            error: errorData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const aiResult = await openAIResponse.json();
      const content = aiResult.choices[0]?.message?.content;
      
      console.log('OpenAI response content:', content);
      
      let gamesData = [];
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          
          if (parsedData.games && Array.isArray(parsedData.games) && parsedData.games.length > 0) {
            gamesData = parsedData.games.slice(0, 16).map((game, index) => ({
              round_id: newRound.id,
              game_number: index + 1,
              home_team: game.homeTeam,
              away_team: game.awayTeam,
              game_date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
            }));
            
            console.log(`Successfully parsed ${gamesData.length} games from OpenAI`);
            
            // Insert games into database
            const { data: insertedGames, error: insertError } = await supabase
              .from('games')
              .insert(gamesData)
              .select();

            if (insertError) {
              console.error('Error inserting games:', insertError);
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  round: newRound,
                  message: `מחזור ${nextRoundNumber} נוצר בהצלחה. שגיאה בהכנסת משחקים למסד הנתונים - תוכל להוסיף אותם ידנית.`,
                  gamesStatus: 'db_error'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            console.log(`Successfully inserted ${insertedGames.length} games`);
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                round: newRound,
                message: `מחזור ${nextRoundNumber} נוצר בהצלחה עם ${insertedGames.length} משחקים מ-ChatGPT!`,
                gamesStatus: 'success',
                games: insertedGames
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
      }

      // If we got here, parsing failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          round: newRound,
          message: `מחזור ${nextRoundNumber} נוצר בהצלחה. לא הצלחנו לנתח את התשובה מ-ChatGPT - תוכל להוסיף משחקים ידנית.`,
          gamesStatus: 'parse_error',
          rawResponse: content
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (openAIError) {
      console.error('Error calling OpenAI:', openAIError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          round: newRound,
          message: `מחזור ${nextRoundNumber} נוצר בהצלחה. שגיאה בקריאה ל-OpenAI - תוכל להוסיף משחקים ידנית.`,
          gamesStatus: 'connection_error'
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
