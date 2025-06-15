import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowRight, Calendar, AlertCircle, SendHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GamePrediction {
  gameId: number;
  predictions: string[];
  isDouble: boolean;
}

const SubmitBet = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<GamePrediction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Sample games data (16 games)
  const games = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    homeTeam: `קבוצה בית ${i + 1}`,
    awayTeam: `קבוצה חוץ ${i + 1}`,
  }));

  // Calculate next Saturday at 13:00
  const getNextSaturday = () => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSaturday;
    
    if (currentDay === 6) {
      const currentHour = now.getHours();
      if (currentHour < 13) {
        daysUntilSaturday = 0;
      } else {
        daysUntilSaturday = 7;
      }
    } else {
      daysUntilSaturday = (6 - currentDay) % 7;
      if (daysUntilSaturday === 0) daysUntilSaturday = 7;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(13, 0, 0, 0);
    return nextSaturday;
  };

  const deadline = getNextSaturday();
  const isDeadlinePassed = new Date() > deadline;

  const handlePredictionChange = (gameId: number, option: string, checked: boolean) => {
    const existingPrediction = predictions.find(p => p.gameId === gameId);
    const newPredictions = predictions.filter(p => p.gameId !== gameId);
    
    let newGamePredictions: string[] = [];
    
    if (existingPrediction) {
      newGamePredictions = [...existingPrediction.predictions];
    }
    
    if (checked) {
      if (!newGamePredictions.includes(option)) {
        newGamePredictions.push(option);
      }
    } else {
      newGamePredictions = newGamePredictions.filter(p => p !== option);
    }
    
    if (newGamePredictions.length > 0) {
      newPredictions.push({
        gameId,
        predictions: newGamePredictions,
        isDouble: newGamePredictions.length === 2
      });
    }
    
    setPredictions(newPredictions);
  };

  const getDoublesCount = () => {
    return predictions.filter(p => p.isDouble).length;
  };

  const handleSubmit = () => {
    if (isDeadlinePassed) {
      toast({
        title: "שגיאה",
        description: "המועד האחרון להגשה עבר",
        variant: "destructive",
      });
      return;
    }

    const doublesCount = getDoublesCount();
    if (doublesCount !== 3) {
      toast({
        title: "שגיאה",
        description: "חובה לבחור בדיוק 3 כפולים",
        variant: "destructive",
      });
      return;
    }

    if (predictions.length !== 16) {
      toast({
        title: "שגיאה",
        description: "יש למלא ניחושים לכל 16 המשחקים",
        variant: "destructive",
      });
      return;
    }

    // Here you would submit the bet
    toast({
      title: "הטור נשלח בהצלחה!",
      description: `הטור של ${user?.user_metadata?.name || user?.email} נשלח עם 3 כפולים`,
    });
  };

  // Calculate deadline time for display
  const formatDeadline = () => {
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeUntilDeadline / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeUntilDeadline % (1000 * 60 * 60)) / (1000 * 60));
    
    if (timeUntilDeadline <= 0) return "המועד עבר";
    return `נותרו ${hoursLeft} שעות ו-${minutesLeft} דקות`;
  };

  const doublesCount = getDoublesCount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This shouldn't render due to redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">הגשת טור חדש</h1>
          <p className="text-gray-600">מלא את הטור שלך למחזור הנוכחי</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              מועד אחרון להגשה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-green-600'}`}>
              {isDeadlinePassed ? 'המועד האחרון להגשה עבר' : formatDeadline()}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              עד יום שבת בשעה 13:00 (זמן ישראל)
            </p>
          </CardContent>
        </Card>

        {isDeadlinePassed && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>לא ניתן להגיש או לערוך טורים לאחר המועד האחרון</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>פרטי הטור</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>שם המשתמש</Label>
                <div className="p-2 bg-gray-50 rounded border text-right">
                  {user.user_metadata?.name || user.email}
                </div>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">כפולים שנוצלו: </span>
              <span className={`font-medium ${doublesCount === 3 ? 'text-green-600' : doublesCount > 3 ? 'text-red-600' : 'text-orange-600'}`}>
                {doublesCount}/3
              </span>
              {doublesCount !== 3 && (
                <span className="text-red-600 text-xs mr-2">
                  (חובה לבחור בדיוק 3 כפולים)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        
        <Card>
          <CardHeader>
            <CardTitle>16 משחקי הטוטו</CardTitle>
            <CardDescription>בחר את התוצאות הצפויות. ניתן לבחור שתי אופציות במשחק אחד (כפול). חובה לבחור בדיוק 3 כפולים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {games.map((game) => {
                const gamePrediction = predictions.find(p => p.gameId === game.id);
                const selectedPredictions = gamePrediction?.predictions || [];
                const isDouble = gamePrediction?.isDouble || false;
                
                return (
                  <div key={game.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">משחק {game.id}</h3>
                      {isDouble && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          כפול
                        </span>
                      )}
                    </div>
                    <div className="text-center mb-3 text-sm text-gray-600 text-right">
                      {game.homeTeam} נגד {game.awayTeam}
                    </div>
                    
                    <div className="flex justify-center gap-8">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor={`home-${game.id}`} className="text-sm font-medium">
                          1
                        </Label>
                        <Checkbox
                          id={`home-${game.id}`}
                          checked={selectedPredictions.includes('home')}
                          onCheckedChange={(checked) => 
                            handlePredictionChange(game.id, 'home', checked as boolean)
                          }
                          disabled={isDeadlinePassed || (selectedPredictions.length >= 2 && !selectedPredictions.includes('home'))}
                        />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor={`draw-${game.id}`} className="text-sm font-medium">
                          X
                        </Label>
                        <Checkbox
                          id={`draw-${game.id}`}
                          checked={selectedPredictions.includes('draw')}
                          onCheckedChange={(checked) => 
                            handlePredictionChange(game.id, 'draw', checked as boolean)
                          }
                          disabled={isDeadlinePassed || (selectedPredictions.length >= 2 && !selectedPredictions.includes('draw'))}
                        />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor={`away-${game.id}`} className="text-sm font-medium">
                          2
                        </Label>
                        <Checkbox
                          id={`away-${game.id}`}
                          checked={selectedPredictions.includes('away')}
                          onCheckedChange={(checked) => 
                            handlePredictionChange(game.id, 'away', checked as boolean)
                          }
                          disabled={isDeadlinePassed || (selectedPredictions.length >= 2 && !selectedPredictions.includes('away'))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                size="lg"
                disabled={isDeadlinePassed || doublesCount !== 3 || predictions.length !== 16}
              >
                <SendHorizontal className="h-4 w-4 mr-2" />
                שלח טור
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitBet;
