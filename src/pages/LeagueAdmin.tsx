import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Key, Copy, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLeague, useIsLeagueAdmin, useLeagueMembers } from '@/hooks/useLeagues';
import { useToast } from '@/hooks/use-toast';
import { useTotoRounds } from '@/hooks/useTotoRounds';
import UpdateDeadlineDialog from '@/components/UpdateDeadlineDialog';

export default function LeagueAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userLeague, isLoading: leagueLoading } = useUserLeague(user?.id);
  const { data: isAdmin, isLoading: adminLoading } = useIsLeagueAdmin(user?.id, userLeague?.id);
  const { data: members } = useLeagueMembers(userLeague?.id);
  const { data: rounds } = useTotoRounds();
  
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  if (leagueLoading || adminLoading) {
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
            <p className="mb-4">אין לך הרשאות אדמין לליגה זו</p>
            <Button onClick={() => navigate('/')}>חזור לעמוד הראשי</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userLeague) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">לא משוייך לליגה</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">אתה לא משוייך לאף ליגה</p>
            <Button onClick={() => navigate('/')}>חזור לעמוד הראשי</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyJoinCode = () => {
    navigator.clipboard.writeText(userLeague.join_code);
    toast({
      title: "הקוד הועתק ללוח",
      description: "ניתן לשתף אותו עם משתמשים חדשים"
    });
  };

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול ליגה</h1>
            <p className="text-gray-600">{userLeague.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Join Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                קוד הצטרפות
              </CardTitle>
              <CardDescription>
                שתף את הקוד הזה עם משתמשים חדשים כדי שיוכלו להצטרף לליגה
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-2xl py-2 px-4">
                  {userLeague.join_code}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyJoinCode}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  העתק
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                משתמשים בליגה ({members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span>{member.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">אין משתמשים בליגה</p>
              )}
            </CardContent>
          </Card>

          {/* Deadlines Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                עדכון דדליינים
              </CardTitle>
              <CardDescription>
                עדכן את המועד האחרון להגשת טורים עבור מחזורים
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rounds && rounds.length > 0 ? (
                <div className="space-y-2">
                  {rounds.map((round) => (
                    <div key={round.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">מחזור {round.round_number}</p>
                        <p className="text-sm text-gray-600">
                          דדליין: {new Date(round.deadline).toLocaleString('he-IL')}
                        </p>
                      </div>
                      <UpdateDeadlineDialog
                        roundId={round.id}
                        roundNumber={round.round_number}
                        currentDeadline={round.deadline}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">אין מחזורים במערכת</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}