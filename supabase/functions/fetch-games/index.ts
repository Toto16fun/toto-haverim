
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

    const { roundId, imageData } = await req.json()
    
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
    let dataSource = 'Manual Input Required'

    // Try to get games from OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (openAIApiKey) {
      try {
        // If imageData is provided, analyze the image
        if (imageData) {
          console.log('Analyzing uploaded image for games')
          
          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'נתח את התמונה והחלץ את 16 המשחקים בטוטו 16. החזר את התשובה בפורמט JSON עם המבנה הבא: {"games": [{"homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"}]} עם בדיוק 16 משחקים בעברית. קבוצות הבית וקבוצות החוץ צריכות להיות בעברית.'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageData
                      }
                    }
                  ]
                }
              ],
              temperature: 0.1
            })
          })

          if (openAIResponse.ok) {
            const aiResult = await openAIResponse.json()
            const content = aiResult.choices[0]?.message?.content
            
            console.log('Image analysis response:', content)
            
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsedData = JSON.parse(jsonMatch[0])
                
                if (parsedData.games && Array.isArray(parsedData.games) && parsedData.games.length > 0) {
                  gamesData = parsedData.games.slice(0, 16).map((game, index) => ({
                    homeTeam: { name: game.homeTeam },
                    awayTeam: { name: game.awayTeam },
                    utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
                  }))
                  dataSource = 'Image Analysis'
                  console.log(`Successfully extracted ${gamesData.length} games from image`)
                }
              }
            } catch (parseError) {
              console.error('Error parsing image analysis response:', parseError)
            }
          }
        } else {
          // Use the specific prompt we defined earlier
          console.log('Asking ChatGPT for current Toto 16 games with specific prompt')
          
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
                  content: 'תן לי רשימה של 16 המשcheckBoxחקים בטוטו 16 למחזור הקרוב. לפי סדר המשחקים המופיע בתוכנית הטוטו. החזר את התשובה בפורמט JSON עם המבנה הבא: {"games": [{"homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"}]} עם בדיוק 16 משחקים בעברית.'
                }
              ],
              temperature: 0.1,
              max_tokens: 2000
            })
          })

          if (openAIResponse.ok) {
            const aiResult = await openAIResponse.json()
            const content = aiResult.choices[0]?.message?.content
            
            console.log('ChatGPT response:', content)
            
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsedData = JSON.parse(jsonMatch[0])
                
                if (parsedData.games && Array.isArray(parsedData.games) && parsedData.games.length > 0) {
                  gamesData = parsedData.games.slice(0, 16).map((game, index) => ({
                    homeTeam: { name: game.homeTeam },
                    awayTeam: { name: game.awayTeam },
                    utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
                  }))
                  dataSource = 'ChatGPT AI'
                  console.log(`Successfully extracted ${gamesData.length} games from ChatGPT`)
                }
              }
            } catch (parseError) {
              console.error('Error parsing ChatGPT response:', parseError)
            }
          } else {
            const errorResponse = await openAIResponse.json().catch(() => ({}))
            console.error('ChatGPT API request failed:', openAIResponse.status, errorResponse)
          }
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error)
      }
    } else {
      console.log('OpenAI API key not found')
    }

    // If AI failed to get games, create empty placeholder games
    if (gamesData.length === 0) {
      console.log('Creating empty placeholder games for manual input')
      gamesData = Array.from({ length: 16 }, (_, index) => ({
        homeTeam: { name: `קבוצת בית ${index + 1}` },
        awayTeam: { name: `קבוצת חוץ ${index + 1}` },
        utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }))
      dataSource = 'Empty Placeholders'
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
        message: `Successfully inserted ${insertedGames.length} games`,
        games: insertedGames,
        source: dataSource
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
