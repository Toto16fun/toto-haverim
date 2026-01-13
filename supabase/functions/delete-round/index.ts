import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roundId } = await req.json();
    
    if (!roundId) {
      return new Response(JSON.stringify({ error: "Round ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get round info for logging
    const { data: round } = await supabase
      .from("toto_rounds")
      .select("round_number")
      .eq("id", roundId)
      .single();

    // Delete in order (respecting foreign keys)
    // 1. Delete bet_predictions (via user_bets)
    const { error: predError } = await supabase
      .from("bet_predictions")
      .delete()
      .in("bet_id", 
        supabase.from("user_bets").select("id").eq("round_id", roundId)
      );

    // Actually we need to do this differently - get the bet IDs first
    const { data: bets } = await supabase
      .from("user_bets")
      .select("id")
      .eq("round_id", roundId);

    const betIds = bets?.map(b => b.id) || [];

    if (betIds.length > 0) {
      const { error: predDeleteError } = await supabase
        .from("bet_predictions")
        .delete()
        .in("bet_id", betIds);
      
      if (predDeleteError) {
        console.error("Error deleting predictions:", predDeleteError);
      }
    }

    // 2. Delete user_bets
    const { error: betsError } = await supabase
      .from("user_bets")
      .delete()
      .eq("round_id", roundId);

    if (betsError) {
      console.error("Error deleting bets:", betsError);
    }

    // 3. Delete round_scores
    const { error: scoresError } = await supabase
      .from("round_scores")
      .delete()
      .eq("round_id", roundId);

    if (scoresError) {
      console.error("Error deleting scores:", scoresError);
    }

    // 4. Delete games
    const { error: gamesError } = await supabase
      .from("games")
      .delete()
      .eq("round_id", roundId);

    if (gamesError) {
      console.error("Error deleting games:", gamesError);
    }

    // 5. Delete the round itself
    const { error: roundError } = await supabase
      .from("toto_rounds")
      .delete()
      .eq("id", roundId);

    if (roundError) {
      throw roundError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Round ${round?.round_number || roundId} deleted successfully` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
