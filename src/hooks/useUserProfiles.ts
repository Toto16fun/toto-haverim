
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  created_at: string;
}

export const useUserProfiles = () => {
  return useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      console.log('🔍 Fetching user profiles...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching user profiles:', error);
        throw error;
      }
      
      console.log('✅ Fetched user profiles:', data?.length || 0, 'profiles');
      return data as UserProfile[];
    }
  });
};

export const useUserProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log('🔍 Fetching user profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching user profile:', error);
        throw error;
      }
      
      console.log('✅ User profile data:', data);
      return data as UserProfile | null;
    },
    enabled: !!userId
  });
};
