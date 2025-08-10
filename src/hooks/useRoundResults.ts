import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoundGame {
  id: string;
  home_team: string;
  away_team: string;
  result: string | null;
  game_number: number;
}

export interface RoundTicket {
  id: string;
  user_id: string;
}

export interface RoundPrediction {
  bet_id: string;
  game_id: string;
  predictions: string[];
  is_double: boolean;
}

export interface RoundData {
  games: RoundGame[];
  tickets: RoundTicket[];
  predictions: RoundPrediction[];
}

export function useRoundData(roundId: string) {
  return useQuery({
    queryKey: ['round-data', roundId],
    queryFn: async (): Promise<RoundData> => {
      const [gamesResult, ticketsResult, predictionsResult] = await Promise.all([
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

      if (gamesResult.error) throw gamesResult.error;
      if (ticketsResult.error) throw ticketsResult.error;
      if (predictionsResult.error) throw predictionsResult.error;

      return {
        games: gamesResult.data || [],
        tickets: ticketsResult.data || [],
        predictions: predictionsResult.data || []
      };
    },
    enabled: !!roundId
  });
}