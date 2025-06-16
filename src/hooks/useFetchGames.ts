
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFetchGames = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (roundId: string) => {
      console.log('Calling fetch-games function for round:', roundId);
      
      const { data, error } = await supabase.functions.invoke('fetch-games', {
        body: { roundId }
      });
      
      if (error) {
        console.error('Error calling fetch-games function:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, roundId) => {
      console.log('Games fetched successfully:', data);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['games', roundId] });
      queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      
      toast({
        title: "משחקים נשלפו בהצלחה!",
        description: `${data.games?.length || 16} משחקים התווספו למחזור`,
      });
    },
    onError: (error) => {
      console.error('Error fetching games:', error);
      toast({
        title: "שגיאה בשליפת משחקים",
        description: "לא הצלחנו לשלוף את המשחקים. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    }
  });
};
