
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useUserBets } from '@/hooks/useUserBets';
import GamesTable from '@/components/GamesTable';
import NewRoundDialog from '@/components/NewRoundDialog';

const CurrentRound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: userBets } = useUserBets(currentRound?.id);
  const [showNewRoundDialog, setShowNewRoundDialog] = useState(false);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);

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

  // Check if deadline has passed
  const isDeadlinePassed = currentRound && new Date() > new Date(currentRound.deadline);

  // Convert bet predictions to format expected by GamesTable
  const getBetPredictionsForDisplay = (bet: any) => {
    if (!bet.bet_predictions || !games) return {};
    
    console.log('Converting bet predictions for display:', bet.bet_predictions);
    
    const predictions: Record<string, { predictions: string[]; isDouble: boolean }> = {};
    
    bet.bet_predictions.forEach((prediction: any) => {
      console.log('Processing prediction:', prediction);
      predictions[prediction.game_id] = {
        predictions: prediction.predictions || [],
        isDouble: prediction.is_double || false
      };
    });
    
    console.log('Final predictions format:', predictions);
    return predictions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-full mx-auto">
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
            {/* Round Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-center">
                    מחזור {currentRound.round_number}
                  </CardTitle>
                  <Badge className={isDeadlinePassed ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {isDeadlinePassed ? "מחזור נעול" : "מחזור פעיל"}
                  </Badge>
                </div>
                <p className="text-center text-gray-600">
                  {isDeadlinePassed ? "נעול מאז:" : "סגירה:"} {new Date(currentRound.deadline).toLocaleString('he-IL')}
                </p>
              </CardHeader>
            </Card>

            {/* Games Table - Overview */}
            {games && games.length > 0 && (
              <GamesTable
                games={games}
                isReadOnly={true}
                title="משחקי המחזור"
              />
            )}

            {/* Submitted Bets */}
            <Card>
              <CardHeader>
                <CardTitle>
                  טורים שהוגשו ({userBets?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBets && userBets.length > 0 ? (
                  <div className="space-y-4">
                    {userBets.map(bet => {
                      const doubleCount = bet.bet_predictions?.filter(p => p.is_double).length || 0;
                      const gameCount = bet.bet_predictions?.length || 0;
                      const isExpanded = expandedBetId === bet.id;
                      
                      return (
                        <div key={bet.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {bet.user_id === user.id ? 'הטור שלי' : `משתמש ${bet.user_id.slice(0, 8)}`}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(bet.submitted_at).toLocaleString('he-IL')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={doubleCount === 3 ? "default" : "destructive"}>
                                כפולים: {doubleCount}/3
                              </Badge>
                              <Badge variant={gameCount === 16 ? "default" : "destructive"}>
                                משחקים: {gameCount}/16
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedBetId(isExpanded ? null : bet.id)}
                              >
                                {isExpanded ? 'הסתר' : 'הצג'} תחזיות
                              </Button>
                            </div>
                          </div>
                          
                          {isExpanded && games && (
                            <div className="mt-4">
                              <GamesTable
                                games={games}
                                predictions={getBetPredictionsForDisplay(bet)}
                                isReadOnly={false}
                                title={`תחזיות ${bet.user_id === user.id ? 'שלי' : 'של המשתמש'}`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    עדיין לא הוגשו טורים למחזור זה
                  </div>
                )}
              </CardContent>
            </Card>
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
