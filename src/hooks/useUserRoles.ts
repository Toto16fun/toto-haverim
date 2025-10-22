import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'editor' | 'user';

export const useUserRoles = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return (data?.map(r => r.role) || []) as AppRole[];
    },
    enabled: !!user
  });
};

export const useCanEditResults = () => {
  const { data: roles, isLoading } = useUserRoles();
  
  const canEdit = roles?.includes('admin' as AppRole) || roles?.includes('editor' as AppRole);
  
  return { canEdit: !!canEdit, isLoading };
};