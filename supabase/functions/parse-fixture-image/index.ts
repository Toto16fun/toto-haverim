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

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

async function visionToJson(imageUrl: string) {
  const body = {
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: [
        { 
          type: "text", 
          text: "Extract EXACTLY 16 football fixtures from this image. Return JSON ONLY in this schema: {\"games\": [{\"home\": string, \"away\": string, \"kickoff\": string} x16], \"confidence\": number (0..1)}. For kickoff, extract the time as shown in the image (HH:MM format if possible, or keep original text if not a clear time). No extra fields. Normalize spacing and dashes. If less than 16 can be read, still return games you see and confidence < 0.9."
        },
        { 
          type: "image_url", 
          image_url: { url: imageUrl }
        }
      ]
    }],
    temperature: 0
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${OPENAI_API_KEY}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI error: ${res.status} - ${errorText}`);
  }
  
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content?.trim();
  
  if (!text) {
    throw new Error('No response from OpenAI');
  }
  
  try {
    const parsed = JSON.parse(text);
    return parsed as { games: {home: string, away: string, kickoff: string}[]; confidence: number };
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', text);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

async function aliasNormalize(name: string) {
  const { data, error } = await sb.rpc('normalize_team_name', { p_name: name });
  if (error) {
    console.error('Error normalizing team name:', error);
    return name; // fallback to original name
  }
  return (data ?? name) as string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, roundId, action, games: overrideGames } = await req.json() as { 
      imageUrl?: string; 
      roundId?: string; 
      action?: 'preview'|'save';
      games?: {home: string, away: string, kickoff: string}[];
    };
    
    console.log(`Processing with action: ${action || 'preview'}`);

    // Handle manual override (from UI editing)
    if (action === 'save' && overrideGames) {
      if (!roundId) {
        return new Response(
          JSON.stringify({ error: 'roundId required for save' }), 
          { status: 400, headers: corsHeaders }
        );
      }

      // Get round info for date conversion
      const { data: round, error: roundError } = await sb
        .from('toto_rounds')
        .select('id,status,start_date')
        .eq('id', roundId)
        .single();
      
      if (roundError || !round) {
        return new Response(
          JSON.stringify({ error: 'round not found' }), 
          { status: 404, headers: corsHeaders }
        );
      }

      // Delete existing games for this round
      const { error: deleteError } = await sb
        .from('games')
        .delete()
        .eq('round_id', roundId);
      
      if (deleteError) {
        console.error('Error deleting existing games:', deleteError);
        throw deleteError;
      }

      // Normalize team names and prepare games for insertion
      const gamesToInsert = [];
      for (let i = 0; i < overrideGames.length; i++) {
        const g = overrideGames[i];
        const home = await aliasNormalize((g.home || '').trim());
        const away = await aliasNormalize((g.away || '').trim());
        const kickoffStr = (g.kickoff || '').trim();
        
        // Try to parse kickoff time if it's in HH:MM format
        let kickoffAt = null;
        if (kickoffStr.match(/^\d{1,2}:\d{2}$/)) {
          try {
            // Convert to UTC based on round start_date (assuming Israel timezone)
            const roundDate = new Date(round.start_date);
            const [hours, minutes] = kickoffStr.split(':').map(Number);
            
            // Create date in Israel timezone and convert to UTC
            const gameDateTime = new Date(roundDate.getFullYear(), roundDate.getMonth(), roundDate.getDate(), hours, minutes);
            // Adjust for Israel timezone (UTC+2/+3 depending on DST)
            const israelOffset = 2; // Simplified - should check DST
            kickoffAt = new Date(gameDateTime.getTime() - (israelOffset * 60 * 60 * 1000)).toISOString();
          } catch (e) {
            console.warn(`Failed to parse kickoff time: ${kickoffStr}`, e);
          }
        }

        gamesToInsert.push({
          round_id: roundId,
          home_team: home,
          away_team: away,
          game_number: i + 1,
          kickoff_str: kickoffStr,
          kickoff_at: kickoffAt
        });
      }

      const { error: insertError } = await sb
        .from('games')
        .insert(gamesToInsert);
      
      if (insertError) {
        console.error('Error inserting games:', insertError);
        throw insertError;
      }

      console.log(`Successfully saved ${gamesToInsert.length} games to round ${roundId}`);
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          saved: gamesToInsert.length, 
          confidence: 1.0, 
          ok16: gamesToInsert.length === 16
        }), 
        { headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Process image (for preview or save without override)
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // 1) OCR+LLM → JSON
    const raw = await visionToJson(imageUrl);
    console.log(`OCR extracted ${raw.games?.length || 0} games with confidence ${raw.confidence}`);

    // 2) Normalize aliases + trim + prepare preview
    const normalized = [];
    for (const g of raw.games ?? []) {
      const home = await aliasNormalize((g.home || '').trim());
      const away = await aliasNormalize((g.away || '').trim());
      const kickoff = (g.kickoff || '').trim();
      
      normalized.push({ home, away, kickoff });
    }

    // 3) Validation
    const ok16 = normalized.length === 16 && normalized.every(g => g.home && g.away);

    // 4) Save if requested (without override)
    if (action === 'save') {
      if (!roundId) {
        return new Response(
          JSON.stringify({ error: 'roundId required for save' }), 
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Get round info for date conversion
      const { data: round, error: roundError } = await sb
        .from('toto_rounds')
        .select('id,status,start_date')
        .eq('id', roundId)
        .single();
      
      if (roundError || !round) {
        return new Response(
          JSON.stringify({ error: 'round not found' }), 
          { status: 404, headers: corsHeaders }
        );
      }

      // Delete existing games for this round
      const { error: deleteError } = await sb
        .from('games')
        .delete()
        .eq('round_id', roundId);
      
      if (deleteError) {
        console.error('Error deleting existing games:', deleteError);
        throw deleteError;
      }

      // Insert new games with kickoff parsing
      const gamesToInsert = normalized.map((g, index) => {
        let kickoffAt = null;
        if (g.kickoff.match(/^\d{1,2}:\d{2}$/)) {
          try {
            const roundDate = new Date(round.start_date);
            const [hours, minutes] = g.kickoff.split(':').map(Number);
            const gameDateTime = new Date(roundDate.getFullYear(), roundDate.getMonth(), roundDate.getDate(), hours, minutes);
            const israelOffset = 2; // Simplified timezone conversion
            kickoffAt = new Date(gameDateTime.getTime() - (israelOffset * 60 * 60 * 1000)).toISOString();
          } catch (e) {
            console.warn(`Failed to parse kickoff time: ${g.kickoff}`, e);
          }
        }

        return {
          round_id: roundId,
          home_team: g.home,
          away_team: g.away,
          game_number: index + 1,
          kickoff_str: g.kickoff,
          kickoff_at: kickoffAt
        };
      });

      const { error: insertError } = await sb
        .from('games')
        .insert(gamesToInsert);
      
      if (insertError) {
        console.error('Error inserting games:', insertError);
        throw insertError;
      }

      console.log(`Successfully saved ${normalized.length} games to round ${roundId}`);
      
      return new Response(
        JSON.stringify({ 
          ok: true, 
          saved: normalized.length, 
          confidence: raw.confidence, 
          ok16 
        }), 
        { headers: { ...corsHeaders, 'content-type': 'application/json' } }
      );
    }

    // Preview only
    return new Response(
      JSON.stringify({ 
        ok: true, 
        preview: normalized, 
        confidence: raw.confidence, 
        ok16 
      }), 
      { headers: { ...corsHeaders, 'content-type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in parse-fixture-image function:', error);
    return new Response(
      JSON.stringify({ error: String(error) }), 
      { status: 500, headers: corsHeaders }
    );
  }
});