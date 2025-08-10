import { supabase } from '@/integrations/supabase/client';

export async function computeRoundScores(roundId: string) {
  const { data, error } = await supabase.functions.invoke('computeRoundScores', { 
    body: { roundId } 
  });
  
  if (error) throw error;
  return data;
}

export async function updateGameResult(gameId: string, result: '1' | 'X' | '2') {
  const { error } = await supabase
    .from('games')
    .update({ result })
    .eq('id', gameId);
    
  if (error) throw error;
}

export async function updateAllGameResults(roundId: string, results: Record<string, '1' | 'X' | '2'>) {
  for (const [gameId, result] of Object.entries(results)) {
    await updateGameResult(gameId, result);
  }
}