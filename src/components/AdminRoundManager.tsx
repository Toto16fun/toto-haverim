
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateRound } from '@/hooks/useTotoRounds';
import { supabase } from '@/integrations/supabase/client';

const AdminRoundManager = () => {
  const [roundNumber, setRoundNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
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

      // Create 16 games for this round (empty games that admin will fill later)
      const games = Array.from({ length: 16 }, (_, i) => ({
        round_id: round.id,
        game_number: i + 1,
        home_team: `קבוצה בית ${i + 1}`,
        away_team: `קבוצה חוץ ${i + 1}`
      }));

      const { error } = await supabase
        .from('games')
        .insert(games);

      if (error) throw error;

      toast({
        title: "מחזור נוצר בהצלחה!",
        description: `מחזור ${roundNumber} נוצר עם 16 משחקים`
      });

      // Reset form
      setRoundNumber('');
      setStartDate('');
      setDeadline('');
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את המחזור",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>יצירת מחזור חדש</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default AdminRoundManager;
