import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCurrentRound } from '@/hooks/useTotoRounds';
import { Check, AlertTriangle, ArrowRight, Home, Upload, Image as ImageIcon } from 'lucide-react';
import { previewFixtureImage, saveEditedGames, uploadImageToStorage, type FixtureGame } from '@/hooks/useFixtureImage';

export default function FixtureImageReview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: currentRound } = useCurrentRound();
  
  const roundId = searchParams.get('roundId') || currentRound?.id;
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ תמונה בלבד",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "שגיאה", 
          description: "הקובץ גדול מדי. מקסימום 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setIsProcessing(true);
    
    try {
      // Upload image to storage
      const imageUrl = await uploadImageToStorage(selectedFile);
      
      // Process image with AI
      const result = await previewFixtureImage(imageUrl);
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
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const updateGame = (index: number, field: 'home' | 'away' | 'kickoff', value: string) => {
    if (!games) return;
    const newGames = [...games];
    newGames[index] = { ...newGames[index], [field]: value };
    setGames(newGames);
  };

  const handleSave = async () => {
    if (!games || !roundId) return;
    
    setIsSaving(true);
    try {
      const result = await saveEditedGames(roundId, games);
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

  const resetToUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setGames(null);
    setConfidence(undefined);
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

      {!games ? (
        // Upload section - only shown when no games are processed yet
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                העלאת תמונת לוח זמנים
              </CardTitle>
              <CardDescription>
                העלה צילום מסך של לוח הזמנים לעיבוד אוטומטי של המשחקים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading || isProcessing}
                />
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <div className="border rounded-lg p-2">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-64 mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleUploadAndProcess}
                disabled={!selectedFile || isUploading || isProcessing}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading || isProcessing ? 'מעבד...' : 'עבד תמונה'}
              </Button>

              <p className="text-sm text-muted-foreground">
                התמונה תעובד באמצעות AI כדי לחלץ את פרטי המשחקים. לאחר העיבוד תוכל לערוך ולאשר את הנתונים.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Games editing section - shown after processing
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>משחקי המחזור</CardTitle>
                <div className="flex items-center gap-2">
                  {typeof confidence === 'number' && (
                    <Badge variant={confidence > 0.8 ? 'default' : 'destructive'}>
                      דיוק: {(confidence * 100).toFixed(1)}%
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToUpload}
                  >
                    העלה תמונה חדשה
                  </Button>
                </div>
              </div>
              <CardDescription>
                ערוך את שמות הקבוצות ושעות המשחק לפני השמירה
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 items-center pb-2 border-b font-medium text-sm">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">קבוצת בית</div>
                <div className="col-span-4">קבוצת חוץ</div>
                <div className="col-span-3">שעה</div>
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {games.map((game, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={game.home}
                        onChange={(e) => updateGame(index, 'home', e.target.value)}
                        placeholder="קבוצת בית"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={game.away}
                        onChange={(e) => updateGame(index, 'away', e.target.value)}
                        placeholder="קבוצת חוץ"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={game.kickoff}
                        onChange={(e) => updateGame(index, 'kickoff', e.target.value)}
                        placeholder="שעה"
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
                  disabled={!isValid || isSaving}
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
  );
}