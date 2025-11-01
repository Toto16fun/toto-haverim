
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useUserBets } from '@/hooks/useUserBets';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserRoles } from '@/hooks/useUserRoles';
import GamesTable from '@/components/GamesTable';
import NewRoundDialog from '@/components/NewRoundDialog';
import UpdateDeadlineDialog from '@/components/UpdateDeadlineDialog';
import { formatIsraelDateTime } from '@/lib/utils';

const CurrentRound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games } = useGamesInRound(currentRound?.id);
  const { data: userBets } = useUserBets(currentRound?.id);
  const { data: userProfiles } = useUserProfiles();
  const { data: userRoles } = useUserRoles();
  const [showNewRoundDialog, setShowNewRoundDialog] = useState(false);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = userRoles?.includes('admin');

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const profile = userProfiles?.find(p => p.id === userId);
    return profile?.name || `משתמש ${userId.slice(0, 8)}`;
  };

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

  // Export to Excel function
  const exportToExcel = () => {
    if (!userBets || !games || !userProfiles || !currentRound) return;

    // Create headers
    const headers = ['משתמש', 'זמן הגשה'];
    const sortedGames = [...games].sort((a, b) => a.game_number - b.game_number);
    
    // Add game headers
    sortedGames.forEach(game => {
      headers.push(`משחק ${game.game_number}: ${game.home_team} נ' ${game.away_team}`);
    });
    
    headers.push('כפולים', 'סה"כ משחקים');

    // Create data rows
    const rows = userBets.map(bet => {
      const userName = getUserName(bet.user_id);
      const submittedAt = new Date(bet.submitted_at).toLocaleString('he-IL');
      
      const row = [userName, submittedAt];
      
      // Add predictions for each game
      sortedGames.forEach(game => {
        const prediction = bet.bet_predictions?.find(p => p.game_id === game.id);
        if (prediction) {
          const predictionText = prediction.predictions?.join(', ') || '';
          const doubleText = prediction.is_double ? ' (כפול)' : '';
          row.push(predictionText + doubleText);
        } else {
          row.push('');
        }
      });
      
      // Add summary data
      const doubleCount = bet.bet_predictions?.filter(p => p.is_double).length || 0;
      const gameCount = bet.bet_predictions?.length || 0;
      row.push(doubleCount.toString(), gameCount.toString());
      
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Set column widths
    const colWidths = headers.map((header, index) => {
      if (index < 2) return { wch: 15 }; // User name and time columns
      if (index >= headers.length - 2) return { wch: 10 }; // Summary columns
      return { wch: 25 }; // Game columns
    });
    ws['!cols'] = colWidths;

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `מחזור ${currentRound.round_number}`);
    
    const fileName = `מחזור_${currentRound.round_number}_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
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
            <div className="flex gap-2 mr-auto">
              <Button
                onClick={() => setShowNewRoundDialog(true)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                פתיחת מחזור חדש
              </Button>
              {currentRound && (
                <UpdateDeadlineDialog
                  roundId={currentRound.id}
                  currentDeadline={currentRound.deadline}
                />
              )}
            </div>
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
                  {isDeadlinePassed ? "נעול מאז:" : "סגירה:"} {formatIsraelDateTime(currentRound.deadline)}
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
                <div className="flex items-center justify-between">
                  <CardTitle>
                    טורים שהוגשו ({userBets?.length || 0})
                  </CardTitle>
                  {userBets && userBets.length > 0 && (
                    <Button
                      onClick={exportToExcel}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      ייצא לאקסל
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {userBets && userBets.length > 0 ? (
                  <div className="space-y-4">
                    {userBets.map(bet => {
                      const doubleCount = bet.bet_predictions?.filter(p => p.is_double).length || 0;
                      const gameCount = bet.bet_predictions?.length || 0;
                      const isExpanded = expandedBetId === bet.id;
                      const userName = getUserName(bet.user_id);
                      
                      return (
                        <div key={bet.id} className="border rounded-lg p-2 sm:p-4 bg-white">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-sm sm:text-base">
                                  {bet.user_id === user.id ? 'הטור שלי' : userName}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {new Date(bet.submitted_at).toLocaleString('he-IL')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <Badge variant={doubleCount === 3 ? "default" : "destructive"} className="text-xs">
                                כפולים: {doubleCount}/3
                              </Badge>
                              <Badge variant={gameCount === 16 ? "default" : "destructive"} className="text-xs">
                                משחקים: {gameCount}/16
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedBetId(isExpanded ? null : bet.id)}
                                className="text-xs sm:text-sm"
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
                                title={`תחזיות ${bet.user_id === user.id ? 'שלי' : `של ${userName}`}`}
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
