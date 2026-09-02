
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Trophy, Target, Award, Zap, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserStatistics } from '@/hooks/useUserStatistics';

const Statistics = () => {
  const { data: playerStats, isLoading, error } = useUserStatistics();

  if (isLoading) {
    return (
      <div className="theme-elite-dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען סטטיסטיקות...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-elite-dark min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400">שגיאה בטעינת הסטטיסטיקות</p>
        </div>
      </div>
    );
  }

  const stats = playerStats || [];
  
  const sortedByHits = [...stats].sort((a, b) => b.total_hits - a.total_hits);
  const sortedByFirstPlace = [...stats].sort((a, b) => b.first_places - a.first_places);
  const sortedByTimesPayer = [...stats].sort((a, b) => b.times_payer - a.times_payer);
  const sortedByBestScore = [...stats].sort((a, b) => b.best_score - a.best_score);

  const getPositionColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-amber-400/10 border-amber-400/30';
      case 1: return 'bg-slate-400/10 border-slate-400/25';
      case 2: return 'bg-orange-500/10 border-orange-500/25';
      default: return 'bg-muted/30 border-border';
    }
  };


  return (
    <div className="theme-elite-dark min-h-screen bg-background p-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground font-display mb-2">סטטיסטיקות העונה</h1>
          <p className="text-muted-foreground">נתונים מצטברים וביצועים של חברי הקבוצה</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                מובילי הפגיעות הכוללות
              </CardTitle>
              <CardDescription>סך כל הפגיעות בעונה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByHits.map((player, index) => (
                  <div key={player.user_id} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.user_name}</span>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {player.total_hits}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {player.rounds_played} מחזורים • ממוצע: {(player.total_hits / player.rounds_played).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-amber-400" />
                מובילי המקום הראשון
              </CardTitle>
              <CardDescription>כמות זכיות במחזורים (מקום ראשון)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByFirstPlace.map((player, index) => (
                  <div key={player.user_id} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.user_name}</span>
                      </div>
                      <span className="text-xl font-bold text-amber-400">
                        {player.first_places}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {player.rounds_played} מחזורים • {((player.first_places / player.rounds_played) * 100).toFixed(1)}% זכיות
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-rose-400" />
                רשימת המשלמים
              </CardTitle>
              <CardDescription>כמות פעמים שהמשתמש נדרש לשלם</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByTimesPayer.map((player, index) => (
                  <div key={player.user_id} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.user_name}</span>
                      </div>
                      <span className="text-xl font-bold text-rose-400">
                        {player.times_payer} 💸
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {player.rounds_played} מחזורים
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-violet-400" />
                שיאים אישיים
              </CardTitle>
              <CardDescription>הישג הפגיעות הטוב ביותר במחזור בודד</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByBestScore.map((player, index) => (
                  <div key={player.user_id} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.user_name}</span>
                      </div>
                      <span className="text-xl font-bold text-violet-400">
                        {player.best_score}/16
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {player.rounds_played} מחזורים
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>טבלת סיכום מלאה</CardTitle>
            <CardDescription>כל הנתונים במקום אחד</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">שם</th>
                    <th className="text-center p-2">סך פגיעות</th>
                    <th className="text-center p-2">מחזורים</th>
                    <th className="text-center p-2">ממוצע</th>
                    <th className="text-center p-2">מקום ראשון</th>
                    <th className="text-center p-2">פעמים שילם</th>
                    <th className="text-center p-2">שיא אישי</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((player) => (
                    <tr key={player.user_id} className="border-b hover:bg-muted/40">
                      <td className="font-medium p-2">{player.user_name}</td>
                      <td className="text-center p-2">{player.total_hits}</td>
                      <td className="text-center p-2">{player.rounds_played}</td>
                      <td className="text-center p-2">{(player.total_hits / player.rounds_played).toFixed(1)}</td>
                      <td className="text-center p-2 text-amber-400">{player.first_places}</td>
                      <td className="text-center p-2 text-rose-400">{player.times_payer}</td>
                      <td className="text-center p-2">{player.best_score}/16</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
