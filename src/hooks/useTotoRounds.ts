
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type TotoRound = Tables<'toto_rounds'>;
export type Game = Tables<'games'>;
export type UserBet = Tables<'user_bets'>;
export type BetPrediction = Tables<'bet_predictions'>;

export const useTotoRounds = () => {
  return useQuery({
    queryKey: ['toto-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('*')
        .order('round_number', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCurrentRound = () => {
  return useQuery({
    queryKey: ['current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toto_rounds')
        .select('*')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });
};

export const useGamesInRound = (roundId: string | undefined) => {
  return useQuery({
    queryKey: ['games', roundId],
    queryFn: async () => {
      if (!roundId) return [];
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('round_id', roundId)
        .order('game_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!roundId
  });
};

export const useCreateRound = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (roundData: TablesInsert<'toto_rounds'>) => {
      const { data, error } = await supabase
        .from('toto_rounds')
        .insert(roundData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['current-round'] });
    }
  });
};
