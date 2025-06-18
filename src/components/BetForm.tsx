
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import GamesTable from './GamesTable';
import { Game } from '@/hooks/useTotoRounds';
import { useSubmitBet, useUpdateBet } from '@/hooks/useUserBets';

interface BetFormProps {
  roundId: string;
  games: Game[];
  existingBet?: any;
  deadline: string;
}

interface GamePrediction {
  gameId: string;
  predictions: string[];
  isDouble: boolean;
}

const BetForm = ({ roundId, games, existingBet, deadline }: BetFormProps) => {
  const [predictions, setPredictions] = useState<Record<string, { predictions: string[]; isDouble: boolean }>>({});
  const { toast } = useToast();
  const submitBet = useSubmitBet();
  const updateBet = useUpdateBet();

  // Check if deadline has passed
  const isDeadlinePassed = new Date() > new Date(deadline);
  const isReadOnly = isDeadlinePassed;

  // Initialize predictions from existing bet
  useEffect(() => {
    if (existingBet?.bet_predictions) {
      const initialPredictions: Record<string, { predictions: string[]; isDouble: boolean }> = {};
      existingBet.bet_predictions.forEach((prediction: any) => {
        initialPredictions[prediction.game_id] = {
          predictions: prediction.predictions,
          isDouble: prediction.is_double
        };
      });
      setPredictions(initialPredictions);
    }
  }, [existingBet]);

  const handlePredictionChange = (gameId: string, newPredictions: string[], isDouble: boolean) => {
    if (isReadOnly) return;
    
    setPredictions(prev => ({
      ...prev,
      [gameId]: {
        predictions: newPredictions,
        isDouble
      }
    }));
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;
    
    const predictionsList = Object.entries(predictions)
      .filter(([_, p]) => p.predictions.length > 0)
      .map(([gameId, p]) => ({
        gameId,
        predictions: p.predictions,
        isDouble: p.isDouble
      }));
    
    if (predictionsList.length !== games.length) {
      toast({
        title: "טור לא שלם",
        description: "יש למלא ניחוש לכל המשחקים",
        variant: "destructive"
      });
      return;
    }

    try {
      if (existingBet) {
        // Update existing bet
        await updateBet.mutateAsync({
          betId: existingBet.id,
          predictions: predictionsList
        });
        
        toast({
          title: "הטור עודכן בהצלחה!",
          description: "השינויים שלך נשמרו במערכת"
        });
      } else {
        // Create new bet
        await submitBet.mutateAsync({
          roundId,
          predictions: predictionsList
        });
        
        toast({
          title: "הטור נשמר בהצלחה!",
          description: "הטור שלך נשמר במערכת"
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את הטור",
        variant: "destructive"
      });
    }
  };

  const getCardTitle = () => {
    if (isDeadlinePassed) {
      return existingBet ? 'הטור שלך (נעול)' : 'טור לא הוגש';
    }
    return existingBet ? 'ערוך את הטור שלך' : 'מלא את הטור שלך';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {getCardTitle()}
          </CardTitle>
          {!isDeadlinePassed && (
            <p className="text-sm text-gray-600">
              עריכה אפשרית עד: {new Date(deadline).toLocaleString('he-IL')}
            </p>
          )}
          {isDeadlinePassed && (
            <p className="text-sm text-red-600">
              זמן ההגשה הסתיים: {new Date(deadline).toLocaleString('he-IL')}
            </p>
          )}
        </CardHeader>
      </Card>

      <GamesTable
        games={games}
        predictions={predictions}
        onPredictionChange={handlePredictionChange}
        isReadOnly={isReadOnly}
        title="משחקי המחזור"
      />
      
      {!isReadOnly && (
        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={submitBet.isPending || updateBet.isPending}
        >
          {submitBet.isPending || updateBet.isPending 
            ? 'שומר...' 
            : existingBet 
              ? 'עדכן טור' 
              : 'שמור טור'
          }
        </Button>
      )}
      
      {isDeadlinePassed && !existingBet && (
        <div className="text-center py-4 text-gray-600">
          לא הוגש טור למחזור זה
        </div>
      )}
    </div>
  );
};

export default BetForm;
