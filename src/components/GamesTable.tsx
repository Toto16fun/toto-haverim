
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Game } from "@/hooks/useTotoRounds";

interface GamesTableProps {
  games: Game[];
  predictions?: Record<string, { predictions: string[]; isDouble: boolean }>;
  onPredictionChange?: (gameId: string, predictions: string[], isDouble: boolean) => void;
  isReadOnly?: boolean;
  title?: string;
}

const GamesTable = ({ 
  games, 
  predictions = {}, 
  onPredictionChange, 
  isReadOnly = false,
  title = "משחקי המחזור"
}: GamesTableProps) => {
  const options = ['1', 'X', '2'];
  const displayOptions = ['1', 'X', '2']; // Fixed order for display
  
  const handleOptionClick = (gameId: string, option: string) => {
    if (isReadOnly || !onPredictionChange) return;
    
    const currentPredictions = predictions[gameId]?.predictions || [];
    let newPredictions: string[];
    
    if (currentPredictions.includes(option)) {
      // Remove option
      newPredictions = currentPredictions.filter(p => p !== option);
    } else {
      // Add option
      newPredictions = [...currentPredictions, option];
    }
    
    // Sort predictions to maintain order
    newPredictions.sort((a, b) => options.indexOf(a) - options.indexOf(b));
    
    onPredictionChange(gameId, newPredictions, newPredictions.length > 1);
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
      return '';
    }
  };

  const formatGameTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">כפול</TableHead>
                <TableHead className="text-center">2</TableHead>
                <TableHead className="text-center">X</TableHead>
                <TableHead className="text-center">1</TableHead>
                <TableHead className="text-center">#</TableHead>
                <TableHead className="text-center">איזו וי</TableHead>
                <TableHead className="text-center">ליגה</TableHead>
                <TableHead className="text-center">תאריך ושעה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map(game => {
                const gamePredictions = predictions[game.id]?.predictions || [];
                const isDouble = predictions[game.id]?.isDouble || false;
                
                return (
                  <TableRow key={game.id}>
                    <TableCell className="text-center">
                      {isDouble && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                          כפול
                        </Badge>
                      )}
                    </TableCell>
                    {displayOptions.reverse().map(option => (
                      <TableCell key={option} className="text-center">
                        <Button
                          variant={gamePredictions.includes(option) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleOptionClick(game.id, option)}
                          disabled={isReadOnly}
                          className={`w-8 h-8 ${
                            gamePredictions.includes(option) 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : ''
                          }`}
                        >
                          {option}
                        </Button>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-medium">
                      {game.game_number}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div>{game.away_team} - {game.home_team}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {game.league ? (
                        <Badge variant="outline" className="text-xs">
                          {game.league}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <div>
                        {game.game_date ? formatGameDate(game.game_date) : '-'}
                      </div>
                      <div>
                        {game.game_date ? formatGameTime(game.game_date) : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamesTable;
