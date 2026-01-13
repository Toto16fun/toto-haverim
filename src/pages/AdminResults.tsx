import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle, Trash2 } from 'lucide-react';
import { useCanEditResults } from '@/hooks/useUserRoles';
import { useTotoRounds, useGamesInRound } from '@/hooks/useTotoRounds';
import { updateAllGameResults, computeRoundScores } from '@/lib/adminActions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminResults() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit, isLoading: rolesLoading } = useCanEditResults();
  const { data: allRounds, isLoading: roundLoading } = useTotoRounds();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const { data: games, isLoading: gamesLoading, refetch } = useGamesInRound(selectedRoundId || allRounds?.[0]?.id);
  
  const [results, setResults] = useState<Record<string, '1' | 'X' | '2'>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentRound = allRounds?.find(r => r.id === (selectedRoundId || allRounds?.[0]?.id));

  const handleDeleteRound = async () => {
    if (!currentRound?.id) return;
    
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('delete-round', {
        body: { roundId: currentRound.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: "המחזור נמחק בהצלחה",
        description: `מחזור ${currentRound.round_number} וכל הנתונים שלו נמחקו`,
      });

      // Reset selection and refetch
      setSelectedRoundId('');
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "שגיאה במחיקת המחזור",
        description: error.message || "אנא נסה שוב",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">עריכת תוצאות משחקים</h1>
            {allRounds && allRounds.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-600">בחר מחזור:</span>
                <Select 
                  value={selectedRoundId || allRounds[0]?.id} 
                  onValueChange={setSelectedRoundId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allRounds.map(round => (
                      <SelectItem key={round.id} value={round.id}>
                        מחזור {round.round_number} ({round.status === 'active' ? 'פעיל' : round.status === 'locked' ? 'נעול' : 'טיוטה'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deleting}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      מחק מחזור
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>האם למחוק את מחזור {currentRound?.round_number}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את המחזור לצמיתות, כולל כל ההימורים, הניחושים והתוצאות.
                        לא ניתן לבטל פעולה זו.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteRound}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? 'מוחק...' : 'מחק לצמיתות'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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