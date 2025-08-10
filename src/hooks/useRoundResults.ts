import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRoundData(roundId: string) {
  return useQuery({
    queryKey: ['round-data', roundId],
    queryFn: async () => {
      const [{ data: games }, { data: tickets }, { data: preds }] = await Promise.all([
        supabase
          .from('games')
          .select('id, home_team, away_team, result, game_number')
          .eq('round_id', roundId)
          .order('game_number'),
        supabase
          .from('user_bets')
          .select('id, user_id')
          .eq('round_id', roundId),
        supabase
          .from('bet_predictions')
          .select('bet_id, game_id, predictions, is_double')
      ]);
      
      return { 
        games: games || [], 
        tickets: tickets || [], 
        preds: preds || [] 
      };
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