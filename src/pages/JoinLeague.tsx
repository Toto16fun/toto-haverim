import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinLeague, useUserLeague } from '@/hooks/useLeagues';
import { useToast } from '@/hooks/use-toast';

export default function JoinLeague() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: currentLeague } = useUserLeague(user?.id);
  const joinLeague = useJoinLeague();
  
  const [joinCode, setJoinCode] = useState('');

  const handleJoinLeague = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין קוד הצטרפות",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי להצטרף לליגה",
        variant: "destructive"
      });
      return;
    }

    try {
      await joinLeague.mutateAsync({
        userId: user.id,
        joinCode: joinCode.toUpperCase()
      });
      
      toast({
        title: "הצטרפת בהצלחה!",
        description: "ברוך הבא לליגה"
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "שגיאה בהצטרפות לליגה",
        description: error.message || "אנא נסה שוב",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="w-full max-w-md">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          חזור
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">הצטרף לליגה</CardTitle>
            <CardDescription className="text-center">
              {currentLeague 
                ? `אתה כרגע בליגה: ${currentLeague.name}`
                : 'הזן קוד הצטרפות כדי להצטרף לליגה'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentLeague && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">שים לב:</p>
                <p>הצטרפות לליגה חדשה תעביר אותך מהליגה הנוכחית</p>
              </div>
            )}

            <div>
              <Label htmlFor="join-code">קוד הצטרפות</Label>
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="הזן קוד הצטרפות"
                className="text-center text-lg tracking-wider font-semibold"
                maxLength={20}
              />
            </div>

            <Button 
              onClick={handleJoinLeague}
              disabled={joinLeague.isPending || !joinCode.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {joinLeague.isPending ? 'מצטרף...' : 'הצטרף לליגה'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
