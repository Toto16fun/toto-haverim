
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateRound } from '@/hooks/useTotoRounds';
import FetchGamesButton from './FetchGamesButton';

const AdminRoundManager = () => {
  const [roundNumber, setRoundNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [createdRoundId, setCreatedRoundId] = useState<string | null>(null);
  const { toast } = useToast();
  const createRound = useCreateRound();

  const handleCreateRound = async () => {
    if (!roundNumber || !startDate || !deadline) {
      toast({
        title: "שדות חסרים",
        description: "יש למלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    try {
      const round = await createRound.mutateAsync({
        round_number: parseInt(roundNumber),
        start_date: startDate,
        deadline: deadline
      });

      setCreatedRoundId(round.id);

      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `מחזור ${roundNumber} נוצר. כעת תוכל לשלוף משחקים אוטומטית`
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את המחזור",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setRoundNumber('');
    setStartDate('');
    setDeadline('');
    setCreatedRoundId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>יצירת מחזור חדש</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!createdRoundId ? (
          <>
            <div>
              <Label htmlFor="roundNumber">מספר מחזור</Label>
              <Input
                id="roundNumber"
                type="number"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                placeholder="למשל 1234"
              />
            </div>

            <div>
              <Label htmlFor="startDate">תאריך התחלה</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deadline">מועד סגירה</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleCreateRound}
              className="w-full"
              disabled={createRound.isPending}
            >
              {createRound.isPending ? 'יוצר...' : 'צור מחזור'}
            </Button>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                מחזור {roundNumber} נוצר בהצלחה!
              </p>
              <p className="text-green-600 text-sm mt-1">
                כעת תוכל לשלוף את המשחקים אוטומטית
              </p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <FetchGamesButton roundId={createdRoundId} />
              <Button onClick={handleReset} variant="outline">
                צור מחזור נוסף
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRoundManager;
