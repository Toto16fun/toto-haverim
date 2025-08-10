
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/hooks/useTotoRounds";

interface GameRowProps {
  game: Game;
  predictions?: string[];
  isDouble?: boolean;
  onPredictionChange?: (gameId: string, predictions: string[], isDouble: boolean) => void;
  isReadOnly?: boolean;
}

const GameRow = ({ 
  game, 
  predictions = [], 
  isDouble = false, 
  onPredictionChange, 
  isReadOnly = false 
}: GameRowProps) => {
  const options = ['1', 'X', '2'];
  const displayOptions = ['1', 'X', '2']; // Correct order
  
  const handleOptionClick = (option: string) => {
    if (isReadOnly || !onPredictionChange) return;
    
    let newPredictions: string[];
    
    if (predictions.includes(option)) {
      // Remove option
      newPredictions = predictions.filter(p => p !== option);
    } else {
      // Add option
      newPredictions = [...predictions, option];
    }
    
    // Sort predictions to maintain order
    newPredictions.sort((a, b) => options.indexOf(a) - options.indexOf(b));
    
    onPredictionChange(game.id, newPredictions, newPredictions.length > 1);
  };

  const formatGameDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">משחק {game.game_number}</span>
              {game.league && (
                <Badge variant="outline" className="text-xs">
                  {game.league}
                </Badge>
              )}
            </div>
            <div className="text-lg font-semibold mb-1">
              {game.home_team} נגד {game.away_team}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {game.game_date && (
                <span>{formatGameDate(game.game_date)}</span>
              )}
              {game.actual_result && (
                <Badge variant="secondary">
                  תוצאה: {game.actual_result}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {displayOptions.map(option => (
              <Button
                key={option}
                variant={predictions.includes(option) ? "default" : "outline"}
                size="sm"
                onClick={() => handleOptionClick(option)}
                disabled={isReadOnly}
                className={`w-12 h-10 ${
                  predictions.includes(option) 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : ''
                }`}
              >
                {option}
              </Button>
            ))}
            
            {isDouble && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                כפול
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameRow;
