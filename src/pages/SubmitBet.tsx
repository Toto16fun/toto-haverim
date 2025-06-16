
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentRound, useGamesInRound } from '@/hooks/useTotoRounds';
import { useMyBetForRound } from '@/hooks/useUserBets';
import BetForm from '@/components/BetForm';
import AdminRoundManager from '@/components/AdminRoundManager';

const SubmitBet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentRound, isLoading: roundLoading } = useCurrentRound();
  const { data: games, isLoading: gamesLoading } = useGamesInRound(currentRound?.id);
  const { data: myBet } = useMyBetForRound(currentRound?.id);
  
  const isAdmin = user?.email === 'tomercohen1995@gmail.com';

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">נדרשת התחברות</h1>
            <p className="text-gray-600 mb-6">יש להתחבר כדי להגיש טור</p>
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
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-green-800">הגשת טור</h1>
        </div>

        {!currentRound ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">אין מחזור פעיל</h2>
              <p className="text-gray-600">עדיין לא נוצר מחזור טוטו חדש</p>
            </div>
            
            {isAdmin && <AdminRoundManager />}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-green-800">
                מחזור {currentRound.round_number}
              </h2>
              <p className="text-gray-600">
                סגירה: {new Date(currentRound.deadline).toLocaleString('he-IL')}
              </p>
            </div>

            {games && games.length > 0 ? (
              <BetForm 
                roundId={currentRound.id}
                games={games}
                existingBet={myBet}
                deadline={currentRound.deadline}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">המשחקים עדיין לא הוגדרו למחזור זה</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitBet;
