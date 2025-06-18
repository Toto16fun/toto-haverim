
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
      console.log('OpenAI API key found, attempting to analyze...')
      
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
                  role: 'system',
                  content: `אתה מומחה בחילוץ נתוני משחקי כדורגל מתמונות טוטו 16. 
                  התפקיד שלך הוא לחלץ במדויק את כל פרטי המשחקים מהתמונה ולהחזיר אותם בפורמט JSON נקי.
                  חשוב להבין שהתמונה מכילה טבלה עם עמודות: ליגה, תאריך ושעה, מספר משחק, קבוצת בית נגד קבוצת חוץ.`
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `אנא נתח את צילום המסך הזה של טוטו 16 וחלץ את כל המשחקים בדיוק כפי שהם מופיעים.

התמונה מציגה טבלה עם המידע הבא לכל משחק:
- ליגה (למשל: פרמייר ליג, ליגה ספרדית, וכו')
- תאריך ושעה של המשחק
- מספר משחק (1-16)
- קבוצת בית נגד קבוצת חוץ

אנא צור טבלה מסודרת עם כל הפרטים האלה ואז חלץ את שמות הקבוצות.

דוגמה לפורמט הטבלה שאני מצפה לראות:
| מספר | ליגה | תאריך ושעה | קבוצת בית | קבוצת חוץ |
|------|------|------------|-----------|----------|
| 1    | פרמייר ליג | 15/06 20:30 | מנצ'סטר יונייטד | ליברפול |

לאחר מכן, החזר את התוצאה בפורמט JSON הבא בלבד:
{
  "table": "הטבלה המלאה בפורמט markdown",
  "games": [
    {"gameNumber": 1, "homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ", "league": "שם הליגה", "datetime": "תאריך ושעה"},
    {"gameNumber": 2, "homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ", "league": "שם הליגה", "datetime": "תאריך ושעה"}
  ]
}

חשוב מאוד:
- וודא שאתה מחלץ בדיוק 16 משחקים
- השתמש בשמות הקבוצות המדויקים מהתמונה
- אל תמציא שמות קבוצות
- שמור על הסדר המופיע בתמונה (משחק 1 עד 16)
- כלול את כל הפרטים: ליגה, תאריך ושעה`
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
              max_tokens: 3000
            })
          })

          console.log('OpenAI Response Status:', openAIResponse.status)

          if (openAIResponse.ok) {
            const aiResult = await openAIResponse.json()
            const content = aiResult.choices[0]?.message?.content
            
            console.log('OpenAI Image Analysis Response:', content)
            
            if (!content) {
              console.error('No content in OpenAI response')
              throw new Error('No content received from OpenAI')
            }
            
            try {
              // Clean the content - remove markdown formatting and extra text
              let cleanedContent = content.trim()
              
              // Remove markdown code blocks if present
              cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
              
              // Try to find JSON in the response
              const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
              
              if (!jsonMatch) {
                console.error('No JSON found in response. Full response:', cleanedContent)
                throw new Error('No JSON structure found in AI response')
              }
              
              const jsonString = jsonMatch[0]
              console.log('Extracted JSON string:', jsonString)
              
              const parsedData = JSON.parse(jsonString)
              console.log('Parsed data structure:', JSON.stringify(parsedData, null, 2))
              
              if (parsedData.table) {
                console.log('Generated table:', parsedData.table)
              }
              
              if (parsedData.games && Array.isArray(parsedData.games)) {
                if (parsedData.games.length === 0) {
                  console.error('Games array is empty')
                  throw new Error('No games found in response')
                }
                
                console.log(`Found ${parsedData.games.length} games in response`)
                
                // Validate each game has required fields
                const validGames = parsedData.games.filter((game, index) => {
                  const isValid = game.homeTeam && game.awayTeam && 
                    typeof game.homeTeam === 'string' && 
                    typeof game.awayTeam === 'string' &&
                    game.homeTeam.trim() !== '' && 
                    game.awayTeam.trim() !== ''
                  
                  if (!isValid) {
                    console.error(`Invalid game at index ${index}:`, game)
                  }
                  
                  return isValid
                })
                
                if (validGames.length === 0) {
                  console.error('No valid games found. All games:', parsedData.games)
                  throw new Error('No valid games with homeTeam and awayTeam found')
                }
                
                console.log(`Validated ${validGames.length} games out of ${parsedData.games.length}`)
                
                gamesData = validGames.slice(0, 16).map((game, index) => ({
                  homeTeam: { name: game.homeTeam.trim() },
                  awayTeam: { name: game.awayTeam.trim() },
                  utcDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
                  league: game.league || '',
                  datetime: game.datetime || ''
                }))
                
                dataSource = 'Image Analysis with Table Structure'
                console.log(`Successfully extracted ${gamesData.length} games from image:`)
                gamesData.forEach((game, index) => {
                  console.log(`${index + 1}. ${game.homeTeam.name} vs ${game.awayTeam.name} (${game.league})`)
                })
                
              } else {
                console.error('Invalid games data structure - missing or invalid games array:', parsedData)
                throw new Error('Invalid response structure - games array not found or invalid')
              }
            } catch (parseError) {
              console.error('Error parsing image analysis response:', parseError)
              console.error('Raw content that failed to parse:', content)
              throw parseError
            }
          } else {
            const errorText = await openAIResponse.text()
            console.error('OpenAI API request failed:', openAIResponse.status, errorText)
            throw new Error(`OpenAI API failed: ${openAIResponse.status} - ${errorText}`)
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
                  content: 'תן לי רשימה של 16 המשחקים בטוטו 16 למחזור הקרוב. לפי סדר המשחקים המופיע בתוכנית הטוטו. החזר את התשובה בפורמט JSON עם המבנה הבא: {"games": [{"homeTeam": "שם קבוצת הבית", "awayTeam": "שם קבוצת החוץ"}]} עם בדיוק 16 משחקים בעברית.'
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
        
        // Return more detailed error information
        return new Response(
          JSON.stringify({ 
            error: 'AI analysis failed', 
            details: error.message,
            hasApiKey: !!openAIApiKey,
            hasImageData: !!imageData 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
