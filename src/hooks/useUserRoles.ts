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
      
      // בינתיים נשתמש בבדיקה פשוטה על בסיס האימייל
      // לאחר שה-migration יאושר, נוכל לעבור לטבלת user_roles
      const roles: AppRole[] = [];
      
      if (user.email === 'tomercohen1995@gmail.com') {
        roles.push('admin');
      }
      
      return roles;
    },
    enabled: !!user
  });
};

export const useCanEditResults = () => {
  const { data: roles, isLoading } = useUserRoles();
  
  const canEdit = roles?.includes('admin' as AppRole) || roles?.includes('editor' as AppRole);
  
  return { canEdit: !!canEdit, isLoading };
};