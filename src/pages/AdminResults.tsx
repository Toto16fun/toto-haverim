import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { useCanEditResults } from '@/hooks/useUserRoles';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { updateAllGameResults, computeRoundScores } from '@/lib/adminActions';
import { useToast } from '@/hooks/use-toast';

export default function AdminResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit, isLoading: rolesLoading } = useCanEditResults();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games, isLoading: gamesLoading, refetch } = useGamesInRound(currentRound?.id);
  
  const [results, setResults] = useState<Record<string, '1' | 'X' | '2'>>({});
  const [saving, setSaving] = useState(false);

  if (rolesLoading || roundLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">אין הרשאה</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">אין לך הרשאה לערוך תוצאות משחקים</p>
            <Button onClick={() => navigate('/')}>חזור לעמוד הראשי</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResultChange = (gameId: string, result: '1' | 'X' | '2') => {
    setResults(prev => ({
      ...prev,
      [gameId]: result
    }));
  };

  const handleSave = async () => {
    if (!currentRound?.id) return;
    
    setSaving(true);
    try {
      await updateAllGameResults(currentRound.id, results);
      await computeRoundScores(currentRound.id);
      await refetch();
      
      toast({
        title: "התוצאות נשמרו בהצלחה",
        description: "הניקוד חושב מחדש עבור כל המשתתפים",
      });
      
      setResults({});
    } catch (error) {
      toast({
        title: "שגיאה בשמירת התוצאות",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(results).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            חזור
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">עריכת תוצאות משחקים</h1>
            {currentRound && (
              <p className="text-gray-600">מחזור {currentRound.round_number}</p>
            )}
          </div>
        </div>

        {!currentRound && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">אין מחזור פעיל כרגע</p>
            </CardContent>
          </Card>
        )}

        {currentRound && gamesLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">טוען משחקים...</p>
            </CardContent>
          </Card>
        )}

        {currentRound && games && games.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">אין משחקים במחזור זה</p>
            </CardContent>
          </Card>
        )}

        {currentRound && games && games.length > 0 && (
          <>
            <div className="grid gap-4 mb-6">
              {games.map((game, index) => {
                const currentResult = results[game.id] || game.result;
                const hasExistingResult = !!game.result;
                
                return (
                  <Card key={game.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">
                              {game.home_team} נגד {game.away_team}
                            </p>
                            {game.league && (
                              <p className="text-xs text-gray-500">{game.league}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {hasExistingResult && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-600">תוצאה קיימת: {game.result}</span>
                            </div>
                          )}
                          
                          <Select
                            value={currentResult || ''}
                            onValueChange={(value: '1' | 'X' | '2') => handleResultChange(game.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="בחר תוצאה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 (בית)</SelectItem>
                              <SelectItem value="X">X (תיקו)</SelectItem>
                              <SelectItem value="2">2 (חוץ)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasChanges && (
              <div className="sticky bottom-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-green-800">
                        יש {Object.keys(results).length} שינויים לא שמורים
                      </p>
                      <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'שומר...' : 'שמור ועדכן ניקוד'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}