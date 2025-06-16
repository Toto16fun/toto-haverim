
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type UserBetWithPredictions = Tables<'user_bets'> & {
  bet_predictions: Tables<'bet_predictions'>[];
};

export const useUserBets = (roundId?: string) => {
  return useQuery({
    queryKey: ['user-bets', roundId],
    queryFn: async () => {
      let query = supabase
        .from('user_bets')
        .select(`
          *,
          bet_predictions (*)
        `);
      
      if (roundId) {
        query = query.eq('round_id', roundId);
      }
      
      const { data, error } = await query.order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as UserBetWithPredictions[];
    },
    enabled: !!roundId
  });
};

export const useMyBetForRound = (roundId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-bet', roundId, user?.id],
    queryFn: async () => {
      if (!user?.id || !roundId) return null;
      
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          *,
          bet_predictions (*)
        `)
        .eq('round_id', roundId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserBetWithPredictions | null;
    },
    enabled: !!user?.id && !!roundId
  });
};

export const useSubmitBet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      roundId, 
      predictions 
    }: { 
      roundId: string; 
      predictions: { gameId: string; predictions: string[]; isDouble: boolean }[] 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Create the bet
      const { data: bet, error: betError } = await supabase
        .from('user_bets')
        .insert({
          user_id: user.id,
          round_id: roundId
        })
        .select()
        .single();
      
      if (betError) throw betError;
      
      // Create predictions
      const predictionInserts = predictions.map(p => ({
        bet_id: bet.id,
        game_id: p.gameId,
        predictions: p.predictions,
        is_double: p.isDouble
      }));
      
      const { error: predictionsError } = await supabase
        .from('bet_predictions')
        .insert(predictionInserts);
      
      if (predictionsError) throw predictionsError;
      
      return bet;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bets', variables.roundId] });
      queryClient.invalidateQueries({ queryKey: ['my-bet', variables.roundId] });
    }
  });
};
