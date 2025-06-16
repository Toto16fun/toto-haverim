
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GameRow from './GameRow';
import { Game } from '@/hooks/useTotoRounds';
import { useSubmitBet } from '@/hooks/useUserBets';

interface BetFormProps {
  roundId: string;
  games: Game[];
  existingBet?: any;
}

interface GamePrediction {
  gameId: string;
  predictions: string[];
  isDouble: boolean;
}

const BetForm = ({ roundId, games, existingBet }: BetFormProps) => {
  const [predictions, setPredictions] = useState<Record<string, GamePrediction>>({});
  const { toast } = useToast();
  const submitBet = useSubmitBet();

  // Initialize predictions from existing bet
  useEffect(() => {
    if (existingBet?.bet_predictions) {
      const initialPredictions: Record<string, GamePrediction> = {};
      existingBet.bet_predictions.forEach((prediction: any) => {
        initialPredictions[prediction.game_id] = {
          gameId: prediction.game_id,
          predictions: prediction.predictions,
          isDouble: prediction.is_double
        };
      });
      setPredictions(initialPredictions);
    }
  }, [existingBet]);

  const handlePredictionChange = (gameId: string, newPredictions: string[], isDouble: boolean) => {
    setPredictions(prev => ({
      ...prev,
      [gameId]: {
        gameId,
        predictions: newPredictions,
        isDouble
      }
    }));
  };

  const handleSubmit = async () => {
    const predictionsList = Object.values(predictions).filter(p => p.predictions.length > 0);
    
    if (predictionsList.length !== games.length) {
      toast({
        title: "טור לא שלם",
        description: "יש למלא ניחוש לכל המשחקים",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitBet.mutateAsync({
        roundId,
        predictions: predictionsList
      });
      
      toast({
        title: "הטור נשמר בהצלחה!",
        description: "הטור שלך נשמר במערכת"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את הטור",
        variant: "destructive"
      });
    }
  };

  const isReadOnly = !!existingBet;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isReadOnly ? 'הטור שלך' : 'מלא את הטור שלך'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {games.map(game => (
          <GameRow
            key={game.id}
            game={game}
            predictions={predictions[game.id]?.predictions || []}
            isDouble={predictions[game.id]?.isDouble || false}
            onPredictionChange={handlePredictionChange}
            isReadOnly={isReadOnly}
          />
        ))}
        
        {!isReadOnly && (
          <Button 
            onClick={handleSubmit}
            className="w-full"
            disabled={submitBet.isPending}
          >
            {submitBet.isPending ? 'שומר...' : 'שמור טור'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BetForm;
