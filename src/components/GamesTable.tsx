
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Game } from "@/hooks/useTotoRounds";
import { isHit } from "@/lib/results";
import { CheckCircle2, XCircle } from "lucide-react";

interface GamesTableProps {
  games: Game[];
  predictions?: Record<string, { predictions: string[]; isDouble: boolean }>;
  onPredictionChange?: (gameId: string, predictions: string[], isDouble: boolean) => void;
  isReadOnly?: boolean;
  title?: string;
  showResults?: boolean; // Show hit/miss indicators
  showSummary?: boolean; // Show summary row at bottom
}

const GamesTable = ({ 
  games, 
  predictions = {}, 
  onPredictionChange, 
  isReadOnly = false,
  title = "משחקי המחזור",
  showResults = false,
  showSummary = false
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


  // If it's read-only, show simplified table without betting options
  if (isReadOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
        </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
               <TableRow>
                 <TableHead className="text-center text-[10px] sm:text-sm p-0.5 sm:p-4">תוצאה נכונה</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-sm p-0.5 sm:p-4 min-w-[80px] sm:min-w-0">קבוצות</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-sm p-0.5 sm:p-4">#</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {games.map(game => (
                  <TableRow key={game.id}>
                    <TableCell className="text-center text-[10px] sm:text-sm p-0.5 sm:p-4">
                      <div className="font-semibold">
                        {game.result ? (
                          <Badge variant="secondary" className="text-[10px] sm:text-sm px-1 py-0">
                            {game.result}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-[9px] sm:text-sm p-0.5 sm:p-4 min-w-[80px] sm:min-w-0">
                      <div className="break-words leading-tight">
                        {game.home_team} - {game.away_team}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-[10px] sm:text-sm p-0.5 sm:p-4">
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
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table className="text-[10px] sm:text-sm">
            <TableHeader>
               <TableRow>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">2</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">X</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">1</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">כפול</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">תוצאה</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4 min-w-[80px] sm:min-w-0">קבוצות</TableHead>
                 <TableHead className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">#</TableHead>
               </TableRow>
            </TableHeader>
             <TableBody>
               {games.map(game => {
                 const gamePredictions = predictions[game.id]?.predictions || [];
                 const isDouble = predictions[game.id]?.isDouble || false;
                 const gameResult = game.result;
                 
                 // Check if predictions hit the result
                 const hit = showResults && gameResult ? isHit(gamePredictions as ('1' | 'X' | '2')[], gameResult as '1' | 'X' | '2') : undefined;
                 
                 // Helper to check if a specific option is correct
                 const isOptionCorrect = (option: string) => {
                   return showResults && gameResult === option;
                 };
                 
                 // Helper to check if a specific option was selected but wrong
                 const isOptionWrong = (option: string) => {
                   return showResults && gameResult && gamePredictions.includes(option) && gameResult !== option;
                 };
                 
                   return (
                    <TableRow key={game.id}>
                      <TableCell className="text-center p-0.5 sm:p-4">
                        <div className="relative inline-block">
                          <Button
                            variant={gamePredictions.includes('2') ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOptionClick(game.id, '2')}
                            disabled={isReadOnly}
                            className={`w-5 h-5 sm:w-8 sm:h-8 text-[10px] sm:text-xs p-0 ${
                              gamePredictions.includes('2') 
                                ? isOptionCorrect('2')
                                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-1'
                                  : isOptionWrong('2')
                                  ? 'bg-blue-600 hover:bg-blue-700 ring-1 ring-red-500'
                                  : 'bg-blue-600 hover:bg-blue-700'
                                : ''
                            }`}
                          >
                            2
                          </Button>
                          {showResults && gamePredictions.includes('2') && isOptionCorrect('2') && (
                            <CheckCircle2 className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 bg-white rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-0.5 sm:p-4">
                        <div className="relative inline-block">
                          <Button
                            variant={gamePredictions.includes('X') ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOptionClick(game.id, 'X')}
                            disabled={isReadOnly}
                            className={`w-5 h-5 sm:w-8 sm:h-8 text-[10px] sm:text-xs p-0 ${
                              gamePredictions.includes('X') 
                                ? isOptionCorrect('X')
                                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-1'
                                  : isOptionWrong('X')
                                  ? 'bg-blue-600 hover:bg-blue-700 ring-1 ring-red-500'
                                  : 'bg-blue-600 hover:bg-blue-700'
                                : ''
                            }`}
                          >
                            X
                          </Button>
                          {showResults && gamePredictions.includes('X') && isOptionCorrect('X') && (
                            <CheckCircle2 className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 bg-white rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-0.5 sm:p-4">
                        <div className="relative inline-block">
                          <Button
                            variant={gamePredictions.includes('1') ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOptionClick(game.id, '1')}
                            disabled={isReadOnly}
                            className={`w-5 h-5 sm:w-8 sm:h-8 text-[10px] sm:text-xs p-0 ${
                              gamePredictions.includes('1') 
                                ? isOptionCorrect('1')
                                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-1'
                                  : isOptionWrong('1')
                                  ? 'bg-blue-600 hover:bg-blue-700 ring-1 ring-red-500'
                                  : 'bg-blue-600 hover:bg-blue-700'
                                : ''
                            }`}
                          >
                            1
                          </Button>
                          {showResults && gamePredictions.includes('1') && isOptionCorrect('1') && (
                            <CheckCircle2 className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 bg-white rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-0.5 sm:p-4">
                        {isDouble && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600 text-[9px] sm:text-xs px-0.5 sm:px-1 py-0">
                            כפול
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-[10px] sm:text-xs p-0.5 sm:p-4">
                        <div className="font-semibold">
                          {gameResult ? (
                            <Badge variant="secondary" className="text-[10px] sm:text-sm px-1 py-0">
                              {gameResult}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </div>
                      </TableCell>
                     <TableCell className="text-center font-medium text-[9px] sm:text-xs p-0.5 sm:p-4 min-w-[80px] sm:min-w-0">
                       <div className="break-words leading-tight">
                         {game.home_team} - {game.away_team}
                       </div>
                     </TableCell>
                     <TableCell className="text-center font-medium text-[10px] sm:text-xs p-0.5 sm:p-4">
                       {game.game_number}
                     </TableCell>
                   </TableRow>
                 );
               })}
               {showSummary && (
                 <TableRow className="border-t-2 bg-muted/30 font-semibold">
                   <TableCell colSpan={4} className="text-center p-1 sm:p-4"></TableCell>
                   <TableCell className="text-center p-1 sm:p-4">
                     <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                       <span className="text-[9px] sm:text-xs text-gray-600">נכונים</span>
                       <Badge variant="default" className="bg-green-600 text-[10px] sm:text-sm px-1.5 py-0.5">
                         {(() => {
                           let correctCount = 0;
                           let finishedGamesCount = 0;
                           games.forEach(game => {
                             if (game.result) {
                               finishedGamesCount++;
                               const gamePreds = predictions[game.id]?.predictions || [];
                               if (gamePreds.includes(game.result)) {
                                 correctCount++;
                               }
                             }
                           });
                           return `${correctCount}/${finishedGamesCount}`;
                         })()}
                       </Badge>
                     </div>
                   </TableCell>
                   <TableCell colSpan={2} className="text-center p-1 sm:p-4"></TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GamesTable;
