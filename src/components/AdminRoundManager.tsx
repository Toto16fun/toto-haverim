
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateRound } from '@/hooks/useTotoRounds';
import { useFetchGames } from '@/hooks/useFetchGames';
import ImageUploadForGames from './ImageUploadForGames';
import { Calendar, Plus, Download } from 'lucide-react';

const AdminRoundManager = () => {
  const [roundNumber, setRoundNumber] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentRoundId, setCurrentRoundId] = useState<string>('');
  
  const { toast } = useToast();
  const createRound = useCreateRound();
  const fetchGames = useFetchGames();

  const handleCreateRound = async () => {
    if (!roundNumber || !deadline) {
      toast({
        title: "שדות חסרים",
        description: "אנא מלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await createRound.mutateAsync({
        round_number: parseInt(roundNumber),
        deadline: new Date(deadline).toISOString()
      });
      
      setCurrentRoundId(result.id);
      setRoundNumber('');
      setDeadline('');
      
      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `מחזור ${result.round_number} נוצר`
      });
    } catch (error) {
      console.error('Error creating round:', error);
    }
  };

  const handleFetchGames = async () => {
    if (!currentRoundId) {
      toast({
        title: "שגיאה",
        description: "אנא צור מחזור תחילה",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetchGames.mutateAsync({ roundId: currentRoundId });
    } catch (error: any) {
      if (error?.message?.includes('נא הזן משחקים ידנית') || 
          error?.response?.data?.requiresManualInput) {
        setShowImageUpload(true);
      }
    }
  };

  const handleImageUploadSuccess = () => {
    setShowImageUpload(false);
    toast({
      title: "הצלחה!",
      description: "המשחקים נטענו בהצלחה מהתמונה"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            ניהול מחזורים (אדמין)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roundNumber">מספר מחזור</Label>
              <Input
                id="roundNumber"
                type="number"
                placeholder="הזן מספר מחזור"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">דדליין</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCreateRound}
            disabled={createRound.isPending}
            className="w-full"
          >
            {createRound.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                יוצר מחזור...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                צור מחזור חדש
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {currentRoundId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              שליפת משחקים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleFetchGames}
              disabled={fetchGames.isPending}
              className="w-full"
            >
              {fetchGames.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  שולף משחקים...
                </>
              ) : (
                'שלוף משחקים אוטומטית'
              )}
            </Button>
            
            {showImageUpload && (
              <div className="mt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    שליפה אוטומטית לא זמינה. אנא העלה צילום מסך של המשחקים:
                  </p>
                </div>
                <ImageUploadForGames 
                  roundId={currentRoundId}
                  onSuccess={handleImageUploadSuccess}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminRoundManager;
