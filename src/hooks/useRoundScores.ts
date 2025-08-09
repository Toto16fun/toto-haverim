import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type RoundScore = Tables<'round_scores'> & {
  user_name?: string;
};

export const useRoundScores = (roundId?: string) => {
  return useQuery({
    queryKey: ['round-scores', roundId],
    queryFn: async () => {
      if (!roundId) return [];
      
      // First get the scores
      const { data: scores, error: scoresError } = await supabase
        .from('round_scores')
        .select('*')
        .eq('round_id', roundId)
        .order('rank', { ascending: true });
      
      if (scoresError) throw scoresError;
      if (!scores || scores.length === 0) return [];
      
      // Get user profiles for the user names
      const userIds = scores.map(score => score.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Combine the data
      const scoresWithNames = scores.map(score => ({
        ...score,
        user_name: profiles?.find(p => p.id === score.user_id)?.name || 'משתמש לא ידוע'
      }));
      
      return scoresWithNames as RoundScore[];
    },
    enabled: !!roundId
  });
};