import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUploadForFixtures } from '@/components/ImageUploadForFixtures';
import { previewFixtureImage, saveFixtureImage, type FixtureGame } from '@/hooks/useFixtureImage';
import { useToast } from '@/hooks/use-toast';
import { useCurrentRound } from '@/hooks/useTotoRounds';
import { Check, AlertTriangle, ArrowRight, Home } from 'lucide-react';

export default function FixtureImageReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentRound } = useCurrentRound();
  
  const roundId = searchParams.get('roundId') || currentRound?.id;
  
  const [imageUrl, setImageUrl] = useState<string>('');
  const [games, setGames] = useState<FixtureGame[] | null>(null);
  const [confidence, setConfidence] = useState<number | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleImageUploaded = async (uploadedImageUrl: string) => {
    setImageUrl(uploadedImageUrl);
    setIsProcessing(true);
    
    try {
      const result = await previewFixtureImage(uploadedImageUrl);
      setGames(result.preview);
      setConfidence(result.confidence);
      
      if (result.confidence < 0.8) {
        toast({
          title: "דיוק נמוך",
          description: `דיוק הזיהוי: ${(result.confidence * 100).toFixed(1)}%. אנא בדוק ועדכן את פרטי המשחקים.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "זוהה בהצלחה",
          description: `זוהו ${result.preview.length} משחקים בדיוק של ${(result.confidence * 100).toFixed(1)}%`,
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "שגיאה בעיבוד",
        description: "לא הצלחנו לעבד את התמונה. נסה שוב או השתמש בתמונה אחרת.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateGame = (index: number, field: 'home' | 'away', value: string) => {
    if (!games) return;
    const newGames = [...games];
    newGames[index] = { ...newGames[index], [field]: value };
    setGames(newGames);
  };

  const handleSave = async () => {
    if (!games || !roundId || !imageUrl) return;
    
    setIsSaving(true);
    try {
      const result = await saveFixtureImage(roundId, imageUrl);
      toast({
        title: "נשמר בהצלחה",
        description: `נשמרו ${result.saved} משחקים למחזור`,
      });
      
      // Navigate to round management or home
      navigate(`/current-round`);
    } catch (error) {
      console.error('Error saving games:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא הצלחנו לשמור את המשחקים. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = games && games.length === 16 && games.every(g => g.home && g.away);

  if (!roundId) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">עיבוד תמונת לוח זמנים</h1>
        <p className="text-muted-foreground">
          העלה צילום מסך של לוח הזמנים וערוך את פרטי המשחקים לפני השמירה
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <ImageUploadForFixtures 
            onImageUploaded={handleImageUploaded}
            isLoading={isProcessing}
          />
        </div>

        {games && (
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>משחקי המחזור</CardTitle>
                  {typeof confidence === 'number' && (
                    <Badge variant={confidence > 0.8 ? 'default' : 'destructive'}>
                      דיוק: {(confidence * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  ערוך את שמות הקבוצות במידת הצורך לפני השמירה
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {games.map((game, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="col-span-5">
                        <Input
                          value={game.home}
                          onChange={(e) => updateGame(index, 'home', e.target.value)}
                          placeholder="קבוצת בית"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-1 text-center text-xs text-muted-foreground">
                        נגד
                      </div>
                      <div className="col-span-5">
                        <Input
                          value={game.away}
                          onChange={(e) => updateGame(index, 'away', e.target.value)}
                          placeholder="קבוצת חוץ"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {isValid ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      {games.length}/16 משחקים {isValid ? 'מוכנים לשמירה' : 'חסרים או לא תקינים'}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={handleSave}
                    disabled={!isValid || isSaving || isProcessing}
                    size="lg"
                  >
                    {isSaving ? (
                      'שומר...'
                    ) : (
                      <>
                        שמור ועבור למחזור
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <h3 className="text-lg font-medium mb-2">מעבד תמונה...</h3>
              <p className="text-muted-foreground">
                זה עשוי לקחת כמה שניות. אנא המתן.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}