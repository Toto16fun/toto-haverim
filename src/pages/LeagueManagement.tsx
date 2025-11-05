import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Users, Key } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useLeagues, useCreateLeague, useLeagueMembers } from '@/hooks/useLeagues';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function LeagueManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: leagues, isLoading: leaguesLoading } = useLeagues();
  const createLeague = useCreateLeague();
  
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newJoinCode, setNewJoinCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAdmin = roles?.includes('admin');

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">אין הרשאה</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">אין לך הרשאה לנהל ליגות</p>
            <Button onClick={() => navigate('/')}>חזור לעמוד הראשי</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateLeague = async () => {
    if (!newLeagueName.trim() || !newJoinCode.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    try {
      await createLeague.mutateAsync({
        name: newLeagueName,
        joinCode: newJoinCode
      });
      
      toast({
        title: "הליגה נוצרה בהצלחה",
        description: `ליגה "${newLeagueName}" עם קוד הצטרפות ${newJoinCode}`
      });
      
      setNewLeagueName('');
      setNewJoinCode('');
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה ביצירת ליגה",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              חזור
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ניהול ליגות</h1>
              <p className="text-gray-600">צפייה ויצירת ליגות חדשות</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                ליגה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>יצירת ליגה חדשה</DialogTitle>
                <DialogDescription>
                  צור ליגה חדשה עם קוד הצטרפות ייחודי
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="league-name">שם הליגה</Label>
                  <Input
                    id="league-name"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="לדוגמה: ליגת החברים 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="join-code">קוד הצטרפות</Label>
                  <Input
                    id="join-code"
                    value={newJoinCode}
                    onChange={(e) => setNewJoinCode(e.target.value.toUpperCase())}
                    placeholder="לדוגמה: LEAGUE2025"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    המשתמשים ישתמשו בקוד זה כדי להצטרף לליגה
                  </p>
                </div>
                <Button 
                  onClick={handleCreateLeague}
                  disabled={createLeague.isPending}
                  className="w-full"
                >
                  {createLeague.isPending ? 'יוצר...' : 'צור ליגה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {leaguesLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">טוען ליגות...</p>
            </CardContent>
          </Card>
        )}

        {!leaguesLoading && leagues && leagues.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">אין ליגות במערכת</p>
            </CardContent>
          </Card>
        )}

        {!leaguesLoading && leagues && leagues.length > 0 && (
          <div className="grid gap-4">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeagueCard({ league }: { league: { id: string; name: string; join_code: string; created_at: string } }) {
  const { data: members } = useLeagueMembers(league.id);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{league.name}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Key className="h-3 w-3" />
                קוד הצטרפות: <Badge variant="outline">{league.join_code}</Badge>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {members?.length || 0} משתמשים
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}