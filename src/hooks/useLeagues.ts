import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface League {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export const useLeagues = () => {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as League[];
    }
  });
};

export const useCreateLeague = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, joinCode }: { name: string; joinCode: string }) => {
      const { data, error } = await supabase
        .from('leagues')
        .insert({ name, join_code: joinCode })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
    }
  });
};

export const useLeagueMembers = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-members', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('league_id', leagueId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!leagueId
  });
};

export const useLeagueAdmins = (leagueId?: string) => {
  return useQuery({
    queryKey: ['league-admins', leagueId],
    queryFn: async () => {
      if (!leagueId) return [];
      
      const { data, error } = await supabase
        .from('league_admins')
        .select(`
          id,
          user_id,
          profiles:user_id (
            id,
            name
          )
        `)
        .eq('league_id', leagueId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!leagueId
  });
};

export const useAddLeagueAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leagueId, userId }: { leagueId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('league_admins')
        .insert({ league_id: leagueId, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-admins', variables.leagueId] });
    }
  });
};

export const useRemoveLeagueAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ adminId, leagueId }: { adminId: string; leagueId: string }) => {
      const { error } = await supabase
        .from('league_admins')
        .delete()
        .eq('id', adminId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['league-admins', variables.leagueId] });
    }
  });
};

export const useUserLeague = (userId?: string) => {
  return useQuery({
    queryKey: ['user-league', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('league_id')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!profile.league_id) return null;
      
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', profile.league_id)
        .single();
      
      if (leagueError) throw leagueError;
      return league as League;
    },
    enabled: !!userId
  });
};

export const useIsLeagueAdmin = (userId?: string, leagueId?: string) => {
  return useQuery({
    queryKey: ['is-league-admin', userId, leagueId],
    queryFn: async () => {
      if (!userId || !leagueId) return false;
      
      const { data, error } = await supabase
        .from('league_admins')
        .select('id')
        .eq('user_id', userId)
        .eq('league_id', leagueId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!leagueId
  });
};