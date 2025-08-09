
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import GamesTable from './GamesTable';
import { Game } from '@/hooks/useTotoRounds';
import { useSubmitBet } from '@/hooks/useUserBets';
import { z } from 'zod';

// Zod schema for bet validation with UUID support
export const BetSchema = z.object({
  predictions: z.array(z.object({
    gameId: z.string().uuid(), // UUID instead of number
    predictions: z.array(z.enum(['1', 'X', '2'])).min(1).max(2),
    isDouble: z.boolean()
  })).length(16) // Exactly 16 games
}).superRefine((val, ctx) => {
  const doubles = val.predictions.filter(x => x.predictions.length === 2).length;
  if (doubles !== 3) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: 'חייבים לבחור בדיוק 3 כפולים' 
    });
  }
});

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

  // Calculate validation status
  const getValidationStatus = () => {
    const predictionsList = Object.entries(predictions)
      .filter(([_, p]) => p.predictions.length > 0);
    
    const doubleCount = predictionsList.filter(([_, p]) => p.isDouble).length;
    const allGamesFilled = predictionsList.length === games.length;
    const exactlyThreeDoubles = doubleCount === 3;

    return {
      allGamesFilled,
      exactlyThreeDoubles,
      doubleCount,
      canSubmit: allGamesFilled && exactlyThreeDoubles && !isReadOnly
    };
  };

  const validation = getValidationStatus();

  const handleSubmit = async () => {
    if (isReadOnly || !validation.canSubmit) return;
    
    try {
      console.log('Starting submission process...');
      console.log('Current predictions:', predictions);
      console.log('Games count:', games.length);
      console.log('Validation status:', validation);
      console.log('Existing bet:', existingBet);
      
      const predictionsList = Object.entries(predictions)
        .filter(([_, p]) => p.predictions.length > 0)
        .map(([gameId, p]) => ({
          gameId, // Already UUID string
          predictions: p.predictions,
          isDouble: p.isDouble
        }));

      console.log('Formatted predictions list:', predictionsList);

      // Validate using Zod schema
      const validationResult = BetSchema.safeParse({ predictions: predictionsList });
      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues.map(issue => issue.message).join(', ');
        throw new Error(errorMessage);
      }

      console.log('Schema validation passed, submitting...');

      // Submit using the validated data
      await submitBet.mutateAsync({
        roundId,
        predictions: predictionsList
      });
      
      toast({
        title: existingBet ? "הטור עודכן בהצלחה!" : "הטור נשלח בהצלחה!",
        description: existingBet ? "השינויים שלך נשמרו במערכת" : "הטור שלך נשמר במערכת"
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      
      toast({
        title: "שגיאה בשליחת הטור",
        description: error.message || "לא הצלחנו לשמור את הטור. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const getStatusDisplay = () => {
    if (isDeadlinePassed) {
      return {
        status: "מחזור נעול",
        color: "bg-red-100 text-red-800",
        message: `הדדליין עבר: ${new Date(deadline).toLocaleString('he-IL')}`
      };
    }

    if (existingBet) {
      return {
        status: "טור הוגש - עריכה אפשרית",
        color: "bg-green-100 text-green-800",
        message: `עריכה אפשרית עד: ${new Date(deadline).toLocaleString('he-IL')}`
      };
    }

    return {
      status: "טור טיוטה",
      color: "bg-yellow-100 text-yellow-800",
      message: `הגשה עד: ${new Date(deadline).toLocaleString('he-IL')}`
    };
  };

  const statusDisplay = getStatusDisplay();

  const getValidationMessage = () => {
    if (isDeadlinePassed) return null;

    const messages = [];
    
    if (!validation.allGamesFilled) {
      messages.push(`יש למלא את כל המשחקים (${Object.keys(predictions).filter(k => predictions[k].predictions.length > 0).length}/${games.length})`);
    }
    
    if (!validation.exactlyThreeDoubles) {
      messages.push(`יש לבחור בדיוק 3 כפולים (נבחרו ${validation.doubleCount})`);
    }

    return messages;
  };

  const validationMessages = getValidationMessage();

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {isDeadlinePassed 
                ? existingBet ? 'הטור שלך (נעול)' : 'טור לא הוגש'
                : existingBet ? 'ערוך את הטור שלך' : 'מלא את הטور שלך'}
            </CardTitle>
            <Badge className={statusDisplay.color}>
              {statusDisplay.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {statusDisplay.message}
          </p>
          
          {/* Validation Messages */}
          {!isDeadlinePassed && validationMessages && validationMessages.length > 0 && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm font-medium text-orange-800 mb-1">דרישות להגשה:</p>
              <ul className="text-sm text-orange-700 space-y-1">
                {validationMessages.map((message, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {!isDeadlinePassed && validation.canSubmit && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ הטור מוכן לשליחה!
              </p>
            </div>
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
          disabled={!validation.canSubmit || submitBet.isPending}
        >
          {submitBet.isPending 
            ? 'שולח...' 
            : 'שלח טור'
          }
        </Button>
      )}
      
      {isDeadlinePassed && !existingBet && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg font-medium mb-2">לא הוגש טור למחזור זה</p>
          <p className="text-sm text-gray-500">הדדליין עבר ולא ניתן עוד להגיש טור</p>
        </div>
      )}
    </div>
  );
};

export default BetForm;
