
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
  const displayOptions = ['1', 'X', '2']; // For betting view
  
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

  // If it's read-only, show simplified table without betting options
  if (isReadOnly) {
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
                  <TableHead className="text-center">קבוצות</TableHead>
                  <TableHead className="text-center">ליגה</TableHead>
                  <TableHead className="text-center">תאריך ושעה</TableHead>
                  <TableHead className="text-center">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map(game => (
                  <TableRow key={game.id}>
                    <TableCell className="text-center font-medium">
                      <div>{game.home_team} - {game.away_team}</div>
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
                    <TableCell className="text-center font-medium">
                      {game.game_number}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For betting view, show full table with betting options - Hebrew RTL order
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
                <TableHead className="text-center">תאריך ושעה</TableHead>
                <TableHead className="text-center">ליגה</TableHead>
                <TableHead className="text-center">קבוצות</TableHead>
                <TableHead className="text-center">#</TableHead>
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
                    <TableCell className="text-center">
                      <Button
                        variant={gamePredictions.includes('2') ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptionClick(game.id, '2')}
                        disabled={isReadOnly}
                        className={`w-8 h-8 ${
                          gamePredictions.includes('2') 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : ''
                        }`}
                      >
                        2
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={gamePredictions.includes('X') ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptionClick(game.id, 'X')}
                        disabled={isReadOnly}
                        className={`w-8 h-8 ${
                          gamePredictions.includes('X') 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : ''
                        }`}
                      >
                        X
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={gamePredictions.includes('1') ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOptionClick(game.id, '1')}
                        disabled={isReadOnly}
                        className={`w-8 h-8 ${
                          gamePredictions.includes('1') 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : ''
                        }`}
                      >
                        1
                      </Button>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <div>
                        {game.game_date ? formatGameDate(game.game_date) : '-'}
                      </div>
                      <div>
                        {game.game_date ? formatGameTime(game.game_date) : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {game.league ? (
                        <Badge variant="outline" className="text-xs">
                          {game.league}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div>{game.home_team} - {game.away_team}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {game.game_number}
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
