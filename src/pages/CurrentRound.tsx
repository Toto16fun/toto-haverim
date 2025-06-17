
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, User, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useUserBets } from '@/hooks/useUserBets';
import GameRow from '@/components/GameRow';
import NewRoundDialog from '@/components/NewRoundDialog';

const CurrentRound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: userBets } = useUserBets(currentRound?.id);
  const [showNewRoundDialog, setShowNewRoundDialog] = useState(false);

  // Basic admin check
  const isAdmin = user?.email === 'tomercohen1995@gmail.com';

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
          
          {isAdmin && (
            <Button
              onClick={() => setShowNewRoundDialog(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 mr-auto"
            >
              <Plus className="h-4 w-4" />
              פתיחת מחזור חדש
            </Button>
          )}
        </div>

        {!currentRound ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">אין מחזור פעיל</h2>
            <p className="text-gray-600">עדיין לא נוצר מחזור טוטו חדש</p>
            {isAdmin && (
              <p className="text-sm text-gray-500 mt-2">השתמש בכפתור "פתיחת מחזור חדש" כדי להתחיל מחזור חדש</p>
            )}
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
                <div className="space-y-2">
                  {games?.map(game => (
                    <GameRow
                      key={game.id}
                      game={game}
                      isReadOnly={true}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  טורים שהוגשו ({userBets?.length || 0})
                </h2>
                <div className="space-y-3">
                  {userBets?.map(bet => (
                    <Card key={bet.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{bet.user_id === user.id ? 'הטור שלי' : `משתמש ${bet.user_id.slice(0, 8)}`}</p>
                              <p className="text-sm text-gray-600">
                                הוגש: {new Date(bet.submitted_at).toLocaleString('he-IL')}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {bet.bet_predictions?.length || 0} ניחושים
                          </div>
                        </div>
                        
                        {bet.bet_predictions && bet.bet_predictions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">תחזיות:</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {bet.bet_predictions.map(prediction => {
                                const game = games?.find(g => g.id === prediction.game_id);
                                return (
                                  <div key={prediction.id} className="flex justify-between bg-gray-50 p-2 rounded">
                                    <span>משחק {game?.game_number || '?'}</span>
                                    <span className="font-medium">
                                      {prediction.predictions.join(', ')}
                                      {prediction.is_double && ' (כפול)'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

        <NewRoundDialog 
          open={showNewRoundDialog}
          onOpenChange={setShowNewRoundDialog}
        />
      </div>
    </div>
  );
};

export default CurrentRound;
