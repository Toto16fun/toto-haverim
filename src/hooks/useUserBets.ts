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
      console.log('🔍 Fetching user bets for round:', roundId);
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
      
      if (error) {
        console.error('❌ Error fetching user bets:', error);
        throw error;
      }
      
      console.log('✅ Fetched user bets:', data?.length || 0, 'bets');
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
      
      console.log('🔍 Fetching my bet for round:', roundId, 'user:', user.id);
      
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          *,
          bet_predictions (*)
        `)
        .eq('round_id', roundId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching my bet:', error);
        throw error;
      }
      
      console.log('✅ My bet data:', data);
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
      console.log('🚀 Starting bet submission...', { roundId, predictionsCount: predictions.length });
      
      if (!user?.id) throw new Error('User not authenticated');
      
      // Enhanced validation - check the new rules
      if (!predictions || predictions.length === 0) {
        throw new Error('No predictions provided');
      }

      // Validate that all games have predictions
      if (predictions.length !== 16) {
        throw new Error('All 16 games must have predictions');
      }
      
      // Validate prediction format and count doubles
      let doubleCount = 0;
      for (const pred of predictions) {
        if (!pred.gameId || !pred.predictions || pred.predictions.length === 0) {
          throw new Error('Invalid prediction format');
        }
        
        // Check if predictions contain valid values
        const validPredictions = pred.predictions.every(p => ['1', 'X', '2'].includes(p));
        if (!validPredictions) {
          throw new Error('Invalid prediction values');
        }
        
        if (pred.isDouble) {
          doubleCount++;
        }
      }

      // Validate exactly 3 doubles
      if (doubleCount !== 3) {
        throw new Error(`Must have exactly 3 doubles, found ${doubleCount}`);
      }
      
      // Check if user already has a bet for this round
      const { data: existingBet } = await supabase
        .from('user_bets')
        .select('id')
        .eq('user_id', user.id)
        .eq('round_id', roundId)
        .maybeSingle();
      
      let betId: string;
      
      if (existingBet) {
        // Update existing bet
        console.log('Found existing bet, updating it...', existingBet.id);
        
        // First, delete existing predictions
        const { error: deleteError } = await supabase
          .from('bet_predictions')
          .delete()
          .eq('bet_id', existingBet.id);
        
        if (deleteError) throw deleteError;
        
        // Update the bet's submitted_at timestamp
        const { error: updateError } = await supabase
          .from('user_bets')
          .update({ submitted_at: new Date().toISOString() })
          .eq('id', existingBet.id);
        
        if (updateError) throw updateError;
        
        betId = existingBet.id;
      } else {
        // Create new bet
        console.log('Creating new bet...');
        const { data: bet, error: betError } = await supabase
          .from('user_bets')
          .insert({
            user_id: user.id,
            round_id: roundId
          })
          .select()
          .single();
        
        if (betError) throw betError;
        betId = bet.id;
      }
      
      // Create predictions
      const predictionInserts = predictions.map(p => ({
        bet_id: betId,
        game_id: p.gameId,
        predictions: p.predictions,
        is_double: p.isDouble
      }));
      
      console.log('Inserting predictions...', predictionInserts.length);
      
      const { error: predictionsError } = await supabase
        .from('bet_predictions')
        .insert(predictionInserts);
      
      if (predictionsError) throw predictionsError;
      
      console.log('✅ Bet submitted successfully!', { betId, roundId });
      
      return { id: betId, roundId };
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidating queries after successful submission...', data);
      
      // Invalidate all relevant queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['user-bets', data.roundId] });
      queryClient.invalidateQueries({ queryKey: ['my-bet', data.roundId] });
      queryClient.invalidateQueries({ queryKey: ['user-bets'] }); // Also invalidate general user-bets query
      
      console.log('✅ Query invalidation completed');
      
      // Force a refetch after a small delay to ensure the data is updated
      setTimeout(() => {
        console.log('🔄 Force refetching user bets...');
        queryClient.refetchQueries({ queryKey: ['user-bets', data.roundId] });
      }, 500);
    }
  });
};

export const useUpdateBet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      betId, 
      predictions 
    }: { 
      betId: string; 
      predictions: { gameId: string; predictions: string[]; isDouble: boolean }[] 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Enhanced validation - same as submit
      if (!predictions || predictions.length === 0) {
        throw new Error('No predictions provided');
      }

      if (predictions.length !== 16) {
        throw new Error('All 16 games must have predictions');
      }

      let doubleCount = 0;
      for (const pred of predictions) {
        if (!pred.gameId || !pred.predictions || pred.predictions.length === 0) {
          throw new Error('Invalid prediction format');
        }
        const validPredictions = pred.predictions.every(p => ['1', 'X', '2'].includes(p));
        if (!validPredictions) {
          throw new Error('Invalid prediction values');
        }
        
        if (pred.isDouble) {
          doubleCount++;
        }
      }

      if (doubleCount !== 3) {
        throw new Error(`Must have exactly 3 doubles, found ${doubleCount}`);
      }
      
      // First, delete existing predictions
      const { error: deleteError } = await supabase
        .from('bet_predictions')
        .delete()
        .eq('bet_id', betId);
      
      if (deleteError) throw deleteError;
      
      // Then, insert new predictions
      const predictionInserts = predictions.map(p => ({
        bet_id: betId,
        game_id: p.gameId,
        predictions: p.predictions,
        is_double: p.isDouble
      }));
      
      const { error: insertError } = await supabase
        .from('bet_predictions')
        .insert(predictionInserts);
      
      if (insertError) throw insertError;
      
      // Update the bet's submitted_at timestamp
      const { data: updatedBet, error: updateError } = await supabase
        .from('user_bets')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', betId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedBet;
    },
    onSuccess: (updatedBet) => {
      queryClient.invalidateQueries({ queryKey: ['user-bets', updatedBet.round_id] });
      queryClient.invalidateQueries({ queryKey: ['my-bet', updatedBet.round_id] });
    }
  });
};
