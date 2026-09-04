
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useMyBetForRound } from '@/hooks/useUserBets';
import BetForm from '@/components/BetForm';
import { formatIsraelDateTime } from '@/lib/utils';
import { useEffect } from 'react';

const SubmitBet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading, refetch: refetchRound } = useCurrentRound();
  const { data: games, isLoading: gamesLoading } = useGamesInRound(currentRound?.id);
  const { data: myBet } = useMyBetForRound(currentRound?.id);
  
  // Basic admin check - can be enhanced later with proper role system
  const isAdmin = user?.email === 'tomercohen1995@gmail.com';

  // Ensure fresh round data on mount - must be before any early return
  useEffect(() => {
    refetchRound();
  }, [refetchRound]);

  if (!user) {
    return (
      <div className="theme-elite-dark min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">נדרשת התחברות</h1>
            <p className="text-muted-foreground mb-6">יש להתחבר כדי להגיש טור</p>
            <Button onClick={() => navigate('/auth')}>
              התחבר
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (roundLoading || gamesLoading) {
    return (
      <div className="theme-elite-dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען נתוני מחזור...</p>
        </div>
      </div>
    );
  }

  // Basic deadline check - prevent submissions after deadline
  const isDeadlinePassed = currentRound && new Date() > new Date(currentRound.deadline);

  return (
    <div className="theme-elite-dark min-h-screen bg-background p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-foreground hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            חזור לעמוד הראשי
          </Button>
          <h1 className="text-3xl font-bold text-foreground font-display">הגשת טור</h1>
        </div>

        {!currentRound ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">אין מחזור פעיל</h2>
            <p className="text-muted-foreground">עדיין לא נוצר מחזור טוטו חדש</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground font-display">
                מחזור {currentRound.round_number}
              </h2>
              <p className="text-muted-foreground">
                סגירה: {formatIsraelDateTime(currentRound.deadline)}
              </p>
              {isDeadlinePassed && (
                <p className="text-red-600 font-semibold mt-2">
                  הדדליין למחזור זה עבר - לא ניתן להגיש או לערוך טור
                </p>
              )}
            </div>

            {games && games.length > 0 ? (
              !isDeadlinePassed ? (
                <BetForm 
                  roundId={currentRound.id}
                  games={games}
                  existingBet={myBet}
                  deadline={currentRound.deadline}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">הדדליין למחזור זה עבר</p>
                  {myBet && (
                    <p className="text-primary mt-2">הטור שלך הוגש בהצלחה</p>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">המשחקים עדיין לא הוגדרו למחזור זה</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitBet;
