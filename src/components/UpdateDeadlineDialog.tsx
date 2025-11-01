import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { updateRoundDeadline } from '@/lib/adminActions';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UpdateDeadlineDialogProps {
  roundId: string;
  currentDeadline: string;
}

export default function UpdateDeadlineDialog({ roundId, currentDeadline }: UpdateDeadlineDialogProps) {
  const [open, setOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateDeadline = async () => {
    if (!newDeadline) {
      toast({
        title: "שגיאה",
        description: "יש למלא תאריך וזמן",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateRoundDeadline(roundId, newDeadline);
      
      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['current-round'] });
      await queryClient.invalidateQueries({ queryKey: ['toto-rounds'] });
      
      toast({
        title: "הצלחה",
        description: "מועד סגירת המחזור עודכן בהצלחה",
      });
      
      setOpen(false);
      setNewDeadline('');
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון מועד הסגירה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          עדכון מועד סגירה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עדכון מועד סגירת המחזור</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>מועד סגירה נוכחי</Label>
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
              {new Date(currentDeadline).toLocaleString('he-IL', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newDeadline">מועד סגירה חדש</Label>
            <Input
              id="newDeadline"
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              placeholder="בחר תאריך ושעה"
            />
            <p className="text-xs text-gray-500">
              הזן תאריך ושעה לפי שעון מקומי (ישראל)
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button
              onClick={handleUpdateDeadline}
              disabled={isLoading}
            >
              {isLoading ? "מעדכן..." : "עדכן מועד סגירה"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
