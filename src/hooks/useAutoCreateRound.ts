
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoCreateRound = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      console.log('Manually triggering auto-create-round...');
      
      const { data, error } = await supabase.functions.invoke('auto-create-round', {
        body: { trigger: 'manual' }
      });
      
      if (error) {
        console.error('Error calling auto-create-round:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Round created successfully:', data);
      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `${data.message || 'מחזור חדש נוצר עם 16 משחקים'}`,
      });
    },
    onError: (error) => {
      console.error('Error creating round:', error);
      toast({
        title: "שגיאה ביצירת מחזור",
        description: "לא הצלחנו ליצור מחזור חדש. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    }
  });
};
