
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoCreateRound = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      console.log('Calling auto-create-round function...');
      
      const { data, error } = await supabase.functions.invoke('auto-create-round', {
        body: { trigger: 'manual' }
      });
      
      if (error) {
        console.error('Error calling auto-create-round function:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Auto create round successful:', data);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['current-round'] });
      
      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `מחזור ${data.round?.round_number} נוצר אוטומטית עם משחקים`,
      });
    },
    onError: (error) => {
      console.error('Error in auto create round:', error);
      toast({
        title: "שגיאה ביצירת מחזור אוטומטי",
        description: "לא הצלחנו ליצור מחזור חדש. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    }
  });
};
