import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { supabase } from '@/integrations/supabase/client';
import { Check, AlertTriangle, Save, Home } from 'lucide-react';
import ImageUploadForGames from '@/components/ImageUploadForGames';

export default function FixtureImageReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentRound } = useCurrentRound();
  
  const roundId = searchParams.get('roundId') || currentRound?.id;
  const { data: games, refetch } = useGamesInRound(roundId);
  
  const [editedGames, setEditedGames] = useState<{[key: string]: {home_team: string, away_team: string}}>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!roundId) {
      toast({
        title: "שגיאה",
        description: "לא נמצא מחזור פעיל. אנא צור מחזור חדש תחילה.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [roundId, navigate, toast]);

  const updateGame = (gameId: string, field: 'home_team' | 'away_team', value: string) => {
    setEditedGames(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [field]: value
      }
    }));
  };

  const getGameValue = (gameId: string, field: 'home_team' | 'away_team', originalValue: string) => {
    return editedGames[gameId]?.[field] ?? originalValue;
  };

  const handleSave = async () => {
    if (!games || !roundId) return;
    
    setIsSaving(true);
    try {
      // Update each edited game
      for (const [gameId, changes] of Object.entries(editedGames)) {
        if (changes.home_team !== undefined || changes.away_team !== undefined) {
          const { error } = await supabase
            .from('games')
            .update({
              ...(changes.home_team !== undefined && { home_team: changes.home_team }),
              ...(changes.away_team !== undefined && { away_team: changes.away_team })
            })
            .eq('id', gameId);

          if (error) {
            throw error;
          }
        }
      }

      toast({
        title: "נשמר בהצלחה",
        description: "שמות הקבוצות עודכנו במחזור",
      });
      
      // Clear edited games and refetch data
      setEditedGames({});
      refetch();
      
      // Navigate to current round
      navigate(`/current-round`);
    } catch (error) {
      console.error('Error saving games:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את שמות הקבוצות. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(editedGames).length > 0;

  if (!roundId) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 2rem)' }}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">לא נמצא מחזור פעיל</h2>
              <p className="text-muted-foreground mb-4">
                אנא צור מחזור חדש תחילה כדי להעלות משחקים
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                חזור לעמוד הבית
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 2rem)' }}>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">עריכת משחקים</h1>
        <p className="text-muted-foreground">
          העלה תמונה/אקסל של המשחקים או ערוך את שמות הקבוצות במחזור הנוכחי
        </p>
      </div>

      {/* Image/Excel Upload Component */}
      {roundId && currentRound?.status !== 'finished' && (
        <ImageUploadForGames 
          roundId={roundId} 
          onSuccess={() => {
            refetch();
            toast({
              title: "המשחקים עודכנו בהצלחה",
              description: "רשימת המשחקים התעדכנה",
            });
          }}
        />
      )}

      {games && games.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>משחקי מחזור {currentRound?.round_number}</CardTitle>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="secondary">
                    {Object.keys(editedGames).length} שינויים
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              לחץ על שמות הקבוצות כדי לערוך אותם
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {games.map((game) => (
                <div key={game.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
                  <div className="col-span-1 text-center text-sm font-medium">
                    {game.game_number}
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={getGameValue(game.id, 'home_team', game.home_team)}
                      onChange={(e) => updateGame(game.id, 'home_team', e.target.value)}
                      placeholder="קבוצת בית"
                      className="text-sm"
                    />
                  </div>
                  <div className="col-span-1 text-center text-xs text-muted-foreground">
                    נגד
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={getGameValue(game.id, 'away_team', game.away_team)}
                      onChange={(e) => updateGame(game.id, 'away_team', e.target.value)}
                      placeholder="קבוצת חוץ"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  {games.length} משחקים במחזור
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/current-round')}
                  variant="outline"
                >
                  ביטול
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  size="lg"
                >
                  {isSaving ? (
                    'שומר...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      שמור שינויים
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">אין משחקים במחזור</h3>
              <p className="text-muted-foreground mb-4">
                לא נמצאו משחקים במחזור הנוכחי. אנא הוסף משחקים תחילה.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                חזור לעמוד הבית
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}