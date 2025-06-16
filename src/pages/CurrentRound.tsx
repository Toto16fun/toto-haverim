
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useUserBets } from '@/hooks/useUserBets';
import GameRow from '@/components/GameRow';

const CurrentRound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: userBets } = useUserBets(currentRound?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">נדרשת התחברות</h1>
            <p className="text-gray-600 mb-6">יש להתחבר כדי לצפות במחזור הנוכחי</p>
            <Button onClick={() => navigate('/auth')}>
              התחבר
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (roundLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני מחזור...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזור לעמוד הראשי
          </Button>
          <h1 className="text-3xl font-bold text-green-800">מחזור נוכחי</h1>
        </div>

        {!currentRound ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">אין מחזור פעיל</h2>
            <p className="text-gray-600">עדיין לא נוצר מחזור טוטו חדש</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  מחזור {currentRound.round_number}
                </CardTitle>
                <p className="text-center text-gray-600">
                  סגירה: {new Date(currentRound.deadline).toLocaleString('he-IL')}
                </p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">משחקי המחזור</h2>
                {games?.map(game => (
                  <GameRow
                    key={game.id}
                    game={game}
                    isReadOnly={true}
                  />
                ))}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  טורים שהוגשו ({userBets?.length || 0})
                </h2>
                <div className="space-y-3">
                  {userBets?.map(bet => (
                    <Card key={bet.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">משתמש {bet.user_id}</p>
                            <p className="text-sm text-gray-600">
                              הוגש: {new Date(bet.submitted_at).toLocaleString('he-IL')}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {bet.bet_predictions?.length || 0} ניחושים
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {!userBets?.length && (
                    <p className="text-gray-600 text-center py-4">
                      עדיין לא הוגשו טורים
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentRound;
