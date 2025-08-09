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

    console.log(`🔒 Locking round: ${roundId}`)

    // 1. עדכון סטטוס הסיבוב לנעול
    const { error: updateError } = await supabase
      .from('toto_rounds')
      .update({ status: 'locked' })
      .eq('id', roundId)

    if (updateError) {
      throw new Error(`Failed to lock round: ${updateError.message}`)
    }

    console.log(`✅ Round ${roundId} locked successfully`)

    // 2. איתור כל המשתמשים במערכת
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // 3. איתור משתמשים שכבר הגישו טפסים
    const { data: existingBets, error: betsError } = await supabase
      .from('user_bets')
      .select('user_id')
      .eq('round_id', roundId)

    if (betsError) {
      throw new Error(`Failed to fetch existing bets: ${betsError.message}`)
    }

    const existingUserIds = new Set(existingBets?.map(bet => bet.user_id) || [])
    const missingUsers = allUsers?.filter(user => !existingUserIds.has(user.id)) || []

    console.log(`👥 Found ${missingUsers.length} users without bets`)

    // 4. יצירת טפסי טוטומט למשתמשים החסרים
    for (const user of missingUsers) {
      // יצירת טופס משתמש
      const { data: ticket, error: ticketError } = await supabase
        .from('user_bets')
        .insert({
          round_id: roundId,
          user_id: user.id,
          is_autofilled: true
        })
        .select()
        .single()

      if (ticketError) {
        console.error(`❌ Failed to create ticket for user ${user.id}:`, ticketError)
        continue
      }

      console.log(`🎫 Created auto-ticket ${ticket.id} for user ${user.id}`)

      // קבלת כל המשחקים בסיבוב
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('round_id', roundId)
        .order('game_number')

      if (gamesError) {
        console.error(`❌ Failed to fetch games:`, gamesError)
        continue
      }

      // בחירת 3 משחקים אקראיים לכפול
      const shuffledGames = [...(games || [])].sort(() => Math.random() - 0.5)
      const doubleGames = shuffledGames.slice(0, 3).map(g => g.id)

      // יצירת ניחושים - רוב תוצאות הבית ('1') + כפולים למשחקים נבחרים
      const predictions = []
      for (const game of games || []) {
        if (doubleGames.includes(game.id)) {
          // משחק כפול - '1' ו-'X'
          predictions.push({
            ticket_id: ticket.id,
            match_id: game.id,
            pick: '1'
          })
          predictions.push({
            ticket_id: ticket.id,
            match_id: game.id,
            pick: 'X'
          })
        } else {
          // משחק רגיל - רק '1'
          predictions.push({
            ticket_id: ticket.id,
            match_id: game.id,
            pick: '1'
          })
        }
      }

      // הכנסת כל הניחושים
      const { error: predictionsError } = await supabase
        .from('predictions')
        .insert(predictions)

      if (predictionsError) {
        console.error(`❌ Failed to create predictions for user ${user.id}:`, predictionsError)
        continue
      }

      console.log(`🎯 Created ${predictions.length} predictions for user ${user.id}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Round ${roundId} locked successfully`,
        autoTicketsCreated: missingUsers.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in lockRound function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})