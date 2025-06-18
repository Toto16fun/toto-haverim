
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

    const { roundId, imageData, excelData } = await req.json()
    
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
    let requiresManualInput = false

    // Process Excel data first (highest priority)
    if (excelData && Array.isArray(excelData) && excelData.length > 0) {
      console.log('Processing Excel data with', excelData.length, 'games')
      
      try {
        gamesData = excelData.slice(0, 16).map((game, index) => ({
          homeTeam: { name: game.homeTeam },
          awayTeam: { name: game.awayTeam },
          utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
        }))
        
        dataSource = 'Excel File'
        console.log('Successfully processed Excel data with', gamesData.length, 'games')
        
      } catch (error) {
        console.error('Error processing Excel data:', error)
        requiresManualInput = true
      }
    }
    // Try to get games from OpenAI only if no Excel data and API key exists and imageData is provided
    else if (imageData) {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
      
      if (openAIApiKey) {
        console.log('OpenAI API key found, attempting to analyze image...')
        
        try {
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
                  role: 'system',
                  content: `אתה מומחה בחילוץ נתוני משחקי כדורגל מתמונות טוטו 16. 
                  התפקיד שלך הוא לחלץ במדויק את כל פרטי המשחקים מהתמונה ולהחזיר אותם בפורמט JSON נקי.`
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `אנא נתח את צילום המסך הזה של טוטו 16 וחלץ את כל המשחקים.

החזר את התוצאה בפורמט JSON הבא בלבד:
{
  "games": [
    {"gameNumber": 1, "homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"},
    {"gameNumber": 2, "homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"}
  ]
}

חשוב מאוד:
- וודא שאתה מחלץ בדיוק 16 משחקים
- השתמש בשמות הקבוצות המדויקים מהתמונה
- אל תמציא שמות קבוצות
- כלול רק את ה-JSON, ללא טקסט נוסף`
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: imageData,
                        detail: 'high'
                      }
                    }
                  ]
                }
              ],
              temperature: 0,
              max_tokens: 2000
            })
          })

          console.log('OpenAI Response Status:', openAIResponse.status)

          if (openAIResponse.ok) {
            const aiResult = await openAIResponse.json()
            const content = aiResult.choices[0]?.message?.content
            
            console.log('OpenAI Response Content:', content)
            
            if (content) {
              try {
                // Try to extract JSON from the response
                const jsonMatch = content.match(/\{[\s\S]*\}/)
                
                if (jsonMatch) {
                  const parsedData = JSON.parse(jsonMatch[0])
                  console.log('Parsed data:', parsedData)
                  
                  if (parsedData.games && Array.isArray(parsedData.games) && parsedData.games.length > 0) {
                    const validGames = parsedData.games.filter(game => 
                      game.homeTeam && game.awayTeam && 
                      typeof game.homeTeam === 'string' && 
                      typeof game.awayTeam === 'string' &&
                      game.homeTeam.trim() !== '' && 
                      game.awayTeam.trim() !== ''
                    )
                    
                    if (validGames.length > 0) {
                      console.log(`Successfully extracted ${validGames.length} games from image`)
                      
                      gamesData = validGames.slice(0, 16).map((game, index) => ({
                        homeTeam: { name: game.homeTeam.trim() },
                        awayTeam: { name: game.awayTeam.trim() },
                        utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
                      }))
                      
                      dataSource = 'Image Analysis'
                    } else {
                      throw new Error('No valid games found in response')
                    }
                  } else {
                    throw new Error('Invalid games data structure')
                  }
                } else {
                  throw new Error('No JSON found in response')
                }
              } catch (parseError) {
                console.error('Error parsing AI response:', parseError)
                requiresManualInput = true
              }
            } else {
              console.error('Empty response from OpenAI')
              requiresManualInput = true
            }
          } else {
            const errorText = await openAIResponse.text()
            console.error('OpenAI API failed:', openAIResponse.status, errorText)
            
            // Check if it's a quota/billing issue
            if (openAIResponse.status === 429) {
              console.log('OpenAI quota exceeded - requiring manual input')
              requiresManualInput = true
            } else {
              throw new Error(`OpenAI API failed: ${openAIResponse.status}`)
            }
          }
        } catch (error) {
          console.error('Error calling OpenAI:', error)
          requiresManualInput = true
        }
      } else {
        console.log('OpenAI API key not available')
        requiresManualInput = true
      }
    } else {
      console.log('No data provided for processing')
      requiresManualInput = true
    }

    // If processing failed or is not available, create empty placeholder games
    if (gamesData.length === 0) {
      console.log('Creating empty placeholder games for manual input')
      gamesData = Array.from({ length: 16 }, (_, index) => ({
        homeTeam: { name: `קבוצת בית ${index + 1}` },
        awayTeam: { name: `קבוצת חוץ ${index + 1}` },
        utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString()
      }))
      dataSource = 'Empty Placeholders'
      requiresManualInput = true
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

    console.log('Inserting games:', gamesToInsert)

    const { data: insertedGames, error: insertError } = await supabase
      .from('games')
      .insert(gamesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting games:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert games', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully inserted ${insertedGames.length} games`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully inserted ${insertedGames.length} games`,
        games: insertedGames,
        source: dataSource,
        requiresManualInput: requiresManualInput
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-games function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
