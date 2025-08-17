
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Trophy, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAllRoundsHistory } from '@/hooks/useUserStatistics';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HistoryMatrix from '@/components/history/HistoryMatrix';

const History = () => {
  console.log('🔥 [HISTORY COMPONENT] History component is mounting...', new Date().toISOString());
  
  const { user, loading: authLoading } = useAuth();
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const { data: roundsData, isLoading, error } = useAllRoundsHistory();
  
  console.log('🔍 [HISTORY PAGE] Auth state:', { user: !!user, authLoading });
  console.log('🔍 [HISTORY PAGE] History page rendered');
  console.log('🔍 [HISTORY PAGE] Current URL:', window.location.href);
  console.log('🔍 [HISTORY PAGE] Query state:', { 
    hasData: !!roundsData, 
    dataLength: roundsData?.length, 
    isLoading, 
    hasError: !!error,
    error: error?.message,
    errorDetails: error 
  });
  console.log('🔍 [HISTORY PAGE] Rounds data sample:', roundsData?.slice(0, 2));

  // Note: History page is public - no auth required

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען היסטוריה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('🔍 [HISTORY PAGE] Error rendering error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">שגיאה בטעינת ההיסטוריה</p>
          <p className="text-sm text-gray-600">שגיאה: {error?.message || 'שגיאה לא ידועה'}</p>
          <p className="text-xs text-gray-500 mt-2">בדוק את הקונסול לפרטים נוספים</p>
        </div>
      </div>
    );
  }

  const rounds = roundsData || [];
  
  // Get all scores from all rounds, filtered by selected round if any
  const allScores = rounds
    .filter(round => selectedRoundId === '' || round.id === selectedRoundId)
    .flatMap(round => 
      round.round_scores?.map(score => ({
        ...score,
        round_number: round.round_number,
        round_date: round.start_date,
        round_status: round.status
      })) || []
    )
    .sort((a, b) => {
      // Sort by round number desc, then by rank asc
      if (a.round_number !== b.round_number) {
        return b.round_number - a.round_number;
      }
      return (a.rank || 999) - (b.rank || 999);
    });

  const getPositionColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';  
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">היסטוריית מחזורים</h1>
          <p className="text-gray-600">צפה בתוצאות של כל המחזורים ובביצועי השחקנים</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              סינון לפי מחזור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedRoundId === '' ? 'default' : 'outline'}
                onClick={() => setSelectedRoundId('')}
              >
                כל המחזורים
              </Button>
              {rounds.map(round => (
                <Button
                  key={round.id}
                  variant={selectedRoundId === round.id ? 'default' : 'outline'}
                  onClick={() => setSelectedRoundId(round.id)}
                >
                  מחזור {round.round_number}
                  {round.status && (
                    <Badge variant="outline" className="mr-2 text-xs">
                      {round.status === 'finished' ? 'הסתיים' : 
                       round.status === 'locked' ? 'נעול' : 'פעיל'}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              תצוגת כרטיסים
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              מטריצת תוצאות
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {allScores.map((score) => (
                <Card key={`${score.user_id}-${score.round_number}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {score.profiles?.name || `משתמש ${score.user_id.slice(0, 8)}...`}
                      </CardTitle>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(score.rank || 999)}`}>
                        מקום {score.rank || '-'}
                      </div>
                    </div>
                    <CardDescription>
                      מחזור {score.round_number} • {new Date(score.round_date).toLocaleDateString('he-IL')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">פגיעות:</span>
                      <span className="font-medium text-green-600">
                        {score.hits}/16
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">אחוז הצלחה:</span>
                      <span className="font-medium">
                        {Math.round((score.hits / 16) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">סטטוס תשלום:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        score.is_payer 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {score.is_payer ? '💸 משלם' : 'לא משלם'}
                      </span>
                    </div>
                    {score.rank === 1 && (
                      <div className="flex items-center text-yellow-600 text-sm">
                        <Trophy className="h-4 w-4 mr-1" />
                        זוכה המחזור!
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {allScores.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedRoundId ? 'לא נמצאו תוצאות עבור המחזור שנבחר' : 'אין נתוני היסטוריה זמינים'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="matrix" className="mt-6">
            {selectedRoundId ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">מטריצת תוצאות עבור מחזור {rounds.find(r => r.id === selectedRoundId)?.round_number}</p>
                <HistoryMatrix roundId={selectedRoundId} />
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">יש לבחור מחזור ספציפי כדי לצפות במטריצת התוצאות</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
