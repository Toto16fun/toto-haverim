import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRoundData(roundId: string) {
  return useQuery({
    queryKey: ['round-data', roundId],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching round data for round:', roundId);
        
        // First get tickets for this round
        const { data: tickets } = await supabase
          .from('user_bets')
          .select('id, user_id')
          .eq('round_id', roundId);
        
        const betIds = tickets?.map(t => t.id) || [];
        
        // Now fetch only predictions for these bets
        const [{ data: games }, { data: preds }, { data: profiles }] = await Promise.all([
          supabase
            .from('games')
            .select('id, home_team, away_team, result, game_number')
            .eq('round_id', roundId)
            .order('game_number'),
          supabase
            .from('bet_predictions')
            .select('bet_id, game_id, predictions, is_double')
            .in('bet_id', betIds.length > 0 ? betIds : ['00000000-0000-0000-0000-000000000000']),
          supabase
            .from('profiles')
            .select('id, name')
        ]);
        
        console.log('✅ Round data fetched:', {
          games: games?.length || 0,
          tickets: tickets?.length || 0, 
          preds: preds?.length || 0,
          profiles: profiles?.length || 0
        });
        
        // מיפוי של user_id לשם
        const userNames = new Map<string, string>();
        profiles?.forEach(p => userNames.set(p.id, p.name));
        
        // הוספת השמות לכרטיסים
        const ticketsWithNames = (tickets || []).map(ticket => ({
          ...ticket,
          userName: userNames.get(ticket.user_id) || `משתמש ${ticket.user_id.slice(0, 8)}...`
        }));
        
        return { 
          games: games || [], 
          tickets: ticketsWithNames, 
          preds: preds || [] 
        };
      } catch (error) {
        console.error('❌ Error in useRoundData:', error);
        throw error;
      }
    },
    enabled: !!roundId
  });
}

export function useGameResults(roundId?: string) {
  return useQuery({
    queryKey: ['game-results', roundId],
    queryFn: async () => {
      if (!roundId) return [];
      
      const { data, error } = await supabase
        .from('games')
        .select('id, home_team, away_team, result, game_number')
        .eq('round_id', roundId)
        .order('game_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!roundId
  });
}