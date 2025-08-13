import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Hook for getting user's personal history
export const useUserHistory = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get user's scores
      const { data: scores, error: scoresError } = await supabase
        .from('round_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (scoresError) throw scoresError;
      if (!scores) return [];
      
      // Get corresponding rounds
      const roundIds = scores.map(s => s.round_id);
      const { data: rounds, error: roundsError } = await supabase
        .from('toto_rounds')
        .select('id, round_number, start_date, status')
        .in('id', roundIds);
      
      if (roundsError) throw roundsError;
      
      // Combine data
      return scores.map(score => ({
        ...score,
        toto_rounds: rounds?.find(r => r.id === score.round_id) || null
      }));
    },
    enabled: !!user?.id
  });
};

// Hook for getting all rounds with their stats
export const useAllRoundsHistory = () => {
  return useQuery({
    queryKey: ['all-rounds-history'],
    queryFn: async () => {
      try {
        console.log('🔍 [HISTORY DEBUG] Starting to fetch rounds history...');
        console.log('🔍 [HISTORY DEBUG] Supabase client exists:', !!supabase);
        console.log('🔍 [HISTORY DEBUG] Current URL:', window.location.href);
        
        // Get rounds
        console.log('🔍 [HISTORY DEBUG] About to fetch rounds from toto_rounds table...');
        const { data: rounds, error: roundsError } = await supabase
          .from('toto_rounds')
          .select('*')
          .order('round_number', { ascending: false });
        
        console.log('🔍 [HISTORY DEBUG] Rounds query result:', { 
          success: !roundsError, 
          error: roundsError, 
          dataExists: !!rounds, 
          dataLength: rounds?.length 
        });
        
        if (roundsError) {
          console.error('❌ [HISTORY DEBUG] Error fetching rounds:', roundsError);
          console.error('❌ [HISTORY DEBUG] Error details:', JSON.stringify(roundsError, null, 2));
          throw roundsError;
        }
        if (!rounds) {
          console.log('⚠️ [HISTORY DEBUG] No rounds found - data is null');
          return [];
        }
        
        console.log('✅ [HISTORY DEBUG] Fetched rounds successfully:', rounds.length);
        
        // Get all scores
        console.log('🔍 [HISTORY DEBUG] About to fetch scores from round_scores table...');
        const { data: scores, error: scoresError } = await supabase
          .from('round_scores')
          .select('*');
        
        console.log('🔍 [HISTORY DEBUG] Scores query result:', { 
          success: !scoresError, 
          error: scoresError, 
          dataExists: !!scores, 
          dataLength: scores?.length 
        });
        
        if (scoresError) {
          console.error('❌ [HISTORY DEBUG] Error fetching scores:', scoresError);
          console.error('❌ [HISTORY DEBUG] Error details:', JSON.stringify(scoresError, null, 2));
          throw scoresError;
        }
        
        console.log('✅ [HISTORY DEBUG] Fetched scores successfully:', scores?.length || 0);
        
        // Get profiles for missing names - handle case where no profiles exist
        const userIds = scores?.map(s => s.user_id).filter(Boolean) || [];
        console.log('🔍 [HISTORY DEBUG] User IDs found in scores:', userIds.length);
        
        let profiles = [];
        if (userIds.length > 0) {
          console.log('🔍 [HISTORY DEBUG] About to fetch profiles...');
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          console.log('🔍 [HISTORY DEBUG] Profiles query result:', { 
            success: !profilesError, 
            error: profilesError, 
            dataExists: !!profilesData, 
            dataLength: profilesData?.length 
          });
          
          if (profilesError) {
            console.warn('⚠️ [HISTORY DEBUG] Warning: Could not fetch profiles:', profilesError);
          }
          profiles = profilesData || [];
          console.log('✅ [HISTORY DEBUG] Fetched profiles successfully:', profiles.length);
        } else {
          console.log('⚠️ [HISTORY DEBUG] No user IDs to fetch profiles for');
        }
        
        // Combine data
        const roundsWithScores = rounds.map(round => ({
          ...round,
          round_scores: scores?.filter(score => score.round_id === round.id).map(score => {
            const userProfile = profiles?.find(p => p.id === score.user_id);
            return {
              ...score,
              profiles: userProfile ? { 
                name: userProfile.name || `משתמש ${score.user_id.slice(0, 8)}...` 
              } : null
            };
          }) || []
        }));
        
        console.log('✅ [HISTORY DEBUG] Combined data successfully:', roundsWithScores.length, 'rounds');
        console.log('🔍 [HISTORY DEBUG] Final data structure:', roundsWithScores.map(r => ({
          id: r.id,
          round_number: r.round_number,
          status: r.status,
          scores_count: r.round_scores?.length || 0
        })));
        
        return roundsWithScores;
      } catch (error) {
        console.error('❌ [HISTORY DEBUG] Error in useAllRoundsHistory:', error);
        console.error('❌ [HISTORY DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Define the interface for user statistics
interface UserStat {
  user_id: string;
  user_name: string;
  total_hits: number;
  rounds_played: number;
  first_places: number;
  best_score: number;
  times_payer: number;
}

// Hook for getting user statistics
export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: async (): Promise<UserStat[]> => {
      // Get all round scores
      const { data: scores, error: scoresError } = await supabase
        .from('round_scores')
        .select('*');
      
      if (scoresError) throw scoresError;
      if (!scores) return [];
      
      // Get all profiles
      const userIds = [...new Set(scores.map(s => s.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Aggregate statistics per user
      const userStats = scores.reduce((acc, score) => {
        const userId = score.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_name: profiles?.find(p => p.id === userId)?.name || 'משתמש לא ידוע',
            total_hits: 0,
            rounds_played: 0,
            first_places: 0,
            best_score: 0,
            times_payer: 0
          };
        }
        
        acc[userId].total_hits += score.hits;
        acc[userId].rounds_played += 1;
        acc[userId].best_score = Math.max(acc[userId].best_score, score.hits);
        
        if (score.rank === 1) acc[userId].first_places += 1;
        if (score.is_payer) acc[userId].times_payer += 1;
        
        return acc;
      }, {} as Record<string, UserStat>);
      
      return Object.values(userStats);
    }
  });
};