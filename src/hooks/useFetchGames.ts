
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFetchGames = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ roundId, imageData }: { roundId: string; imageData?: string }) => {
      console.log('Calling fetch-games function for round:', roundId);
      
      const { data, error } = await supabase.functions.invoke('fetch-games', {
        body: { roundId, imageData }
      });
      
      if (error) {
        console.error('Error calling fetch-games function:', error);
        throw error;
      }
      
      // Check if the response indicates AI is not available
      if (data && data.requiresManualInput) {
        throw new Error('AI_NOT_AVAILABLE');
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Games fetched successfully:', data);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['games', variables.roundId] });
      queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      
      const source = data.source === 'Image Analysis' ? 'מניתוח תמונה' : 
                     data.source === 'ChatGPT AI' ? 'מ-ChatGPT' : 'ידנית';
      
      toast({
        title: "משחקים נשלפו בהצלחה!",
        description: `${data.games?.length || 16} משחקים התווספו למחזור (${source})`,
      });
    },
    onError: (error: any) => {
      console.error('Error fetching games:', error);
      
      if (error.message === 'AI_NOT_AVAILABLE') {
        toast({
          title: "בינה מלאכותית לא זמינה",
          description: "אנא הזן את המשחקים ידנית או נסה שוב מאוחר יותר",
          variant: "destructive"
        });
      } else {
        toast({
          title: "שגיאה בשליפת משחקים",
          description: "לא הצלחנו לשלוף את המשחקים. נסה שוב מאוחר יותר.",
          variant: "destructive"
        });
      }
    }
  });
};
