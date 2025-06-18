
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFetchGames = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ roundId, imageData, excelData }: { 
      roundId: string; 
      imageData?: string; 
      excelData?: any[] 
    }) => {
      console.log('Calling fetch-games function for round:', roundId);
      
      const { data, error } = await supabase.functions.invoke('fetch-games', {
        body: { roundId, imageData, excelData }
      });
      
      if (error) {
        console.error('Error calling fetch-games function:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Games fetched successfully:', data);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['games', variables.roundId] });
      queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      
      if (data.requiresManualInput) {
        toast({
          title: "מחזור נוצר בהצלחה",
          description: "לא הצלחנו לחלץ את המשחקים מהקובץ. אנא הוסף את המשחקים ידנית בעמוד הניהול.",
          variant: "default"
        });
      } else {
        const source = data.source === 'Image Analysis' ? 'מניתוח תמונה' : 
                       data.source === 'Excel File' ? 'מקובץ אקסל' :
                       data.source === 'ChatGPT AI' ? 'מ-ChatGPT' : 'ידנית';
        
        toast({
          title: "משחקים נשלפו בהצלחה!",
          description: `${data.games?.length || 16} משחקים התווספו למחזור (${source})`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Error fetching games:', error);
      
      toast({
        title: "שגיאה בשליפת משחקים",
        description: "לא הצלחנו לשלוף את המשחקים. המחזור נוצר עם משחקים ריקים שניתן לערוך ידנית.",
        variant: "destructive"
      });
    }
  });
};
