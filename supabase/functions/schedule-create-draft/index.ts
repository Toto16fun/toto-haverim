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

function upcomingSaturday13IL() {
  const now = new Date();
  
  // Calculate next Saturday
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=Sunday, 6=Saturday
  const daysToSat = (6 - day + 7) % 7 || 7; // Days until next Saturday
  d.setUTCDate(d.getUTCDate() + daysToSat);
  
  // Set to 13:00 Israel time
  // Israel is UTC+2 in winter (standard time) and UTC+3 in summer (daylight saving)
  // We need to check if the target date is in DST
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isIsraelDST = isDateInIsraelDST(targetDate);
  
  if (isIsraelDST) {
    // Summer time: UTC+3, so 13:00 IL = 10:00 UTC
    d.setUTCHours(10, 0, 0, 0);
  } else {
    // Winter time: UTC+2, so 13:00 IL = 11:00 UTC
    d.setUTCHours(11, 0, 0, 0);
  }
  
  return d.toISOString();
}

function isDateInIsraelDST(date: Date): boolean {
  const year = date.getFullYear();
  
  // Israel DST typically starts on the last Friday in March
  // and ends on the last Sunday in October
  const lastFridayMarch = getLastWeekdayOfMonth(year, 2, 5); // March (2), Friday (5)
  const lastSundayOctober = getLastWeekdayOfMonth(year, 9, 0); // October (9), Sunday (0)
  
  return date >= lastFridayMarch && date < lastSundayOctober;
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of the month
  const lastWeekday = lastDay.getDay();
  const daysBack = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - daysBack);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running scheduled draft creation...');
    
    // Check if there's already an active round for the upcoming week
    const { data: activeRounds, error: activeError } = await sb
      .from('toto_rounds')
      .select('*')
      .eq('status', 'active')
      .limit(1);
    
    if (activeError) {
      console.error('Error checking active rounds:', activeError);
      throw activeError;
    }

    if ((activeRounds ?? []).length > 0) {
      console.log('Active round already exists, skipping draft creation');
      return new Response(
        JSON.stringify({ skipped: 'active round exists', activeRound: activeRounds[0] }), 
        { headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Check if there's already a draft round
    const { data: draftRounds, error: draftError } = await sb
      .from('toto_rounds')
      .select('*')
      .eq('status', 'draft')
      .limit(1);
    
    if (draftError) {
      console.error('Error checking draft rounds:', draftError);
      throw draftError;
    }

    if ((draftRounds ?? []).length > 0) {
      console.log('Draft round already exists, skipping creation');
      return new Response(
        JSON.stringify({ skipped: 'draft round exists', draftRound: draftRounds[0] }), 
        { headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    const deadline = upcomingSaturday13IL();
    
    // Get the next round number
    const { data: lastRound, error: lastRoundError } = await sb
      .from('toto_rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1);
    
    if (lastRoundError) {
      console.error('Error getting last round:', lastRoundError);
      throw lastRoundError;
    }

    const nextNum = ((lastRound?.[0]?.round_number ?? 0) + 1) as number;

    // Create new draft round
    const { data: created, error: createError } = await sb
      .from('toto_rounds')
      .insert({ 
        round_number: nextNum, 
        start_date: new Date().toISOString().split('T')[0], 
        deadline, 
        status: 'draft' 
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating draft round:', createError);
      throw createError;
    }

    console.log(`Successfully created draft round ${nextNum} with ID ${created.id}`);
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        created: created.id, 
        roundNumber: nextNum,
        deadline,
        status: 'draft'
      }), 
      { headers: { ...corsHeaders, 'content-type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in schedule-create-draft function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }), 
      { status: 500, headers: corsHeaders }
    );
  }
});