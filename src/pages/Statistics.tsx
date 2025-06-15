
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Trophy, Target, Award, Zap, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlayerStats {
  username: string;
  totalCorrectGuesses: number;
  firstPlaceCount: number;
  lastPlaceCount: number;
  seasonRecord: number;
  totalTotomat: number;
}

const Statistics = () => {
  // Sample statistics data
  const playerStats: PlayerStats[] = [
    { username: 'דני', totalCorrectGuesses: 45, firstPlaceCount: 3, lastPlaceCount: 0, seasonRecord: 14, totalTotomat: 1 },
    { username: 'יוסי', totalCorrectGuesses: 38, firstPlaceCount: 1, lastPlaceCount: 2, seasonRecord: 12, totalTotomat: 0 },
    { username: 'מיכל', totalCorrectGuesses: 42, firstPlaceCount: 2, lastPlaceCount: 1, seasonRecord: 13, totalTotomat: 0 },
    { username: 'רון', totalCorrectGuesses: 40, firstPlaceCount: 1, lastPlaceCount: 1, seasonRecord: 12, totalTotomat: 0 },
    { username: 'אבי', totalCorrectGuesses: 35, firstPlaceCount: 0, lastPlaceCount: 3, seasonRecord: 11, totalTotomat: 0 },
    { username: 'גיל', totalCorrectGuesses: 37, firstPlaceCount: 1, lastPlaceCount: 1, seasonRecord: 10, totalTotomat: 0 },
  ];

  const sortedByCorrectGuesses = [...playerStats].sort((a, b) => b.totalCorrectGuesses - a.totalCorrectGuesses);
  const sortedByFirstPlace = [...playerStats].sort((a, b) => b.firstPlaceCount - a.firstPlaceCount);
  const sortedByLastPlace = [...playerStats].sort((a, b) => b.lastPlaceCount - a.lastPlaceCount);
  const sortedByRecord = [...playerStats].sort((a, b) => b.seasonRecord - a.seasonRecord);

  const getPositionColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50 border-yellow-200';
      case 1: return 'bg-gray-50 border-gray-200';
      case 2: return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">סטטיסטיקות העונה</h1>
          <p className="text-gray-600">נתונים מצטברים וביצועים של חברי הקבוצה</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                מובילי הניחושים הנכונים
              </CardTitle>
              <CardDescription>סך כל הניחושים המוצלחים בעונה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByCorrectGuesses.map((player, index) => (
                  <div key={player.username} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {player.totalCorrectGuesses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                מובילי המקום הראשון
              </CardTitle>
              <CardDescription>כמות זכיות במחזורים (מקום ראשון)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByFirstPlace.map((player, index) => (
                  <div key={player.username} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">
                        {player.firstPlaceCount}
                      </span>
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
                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                מובילי המקום האחרון
              </CardTitle>
              <CardDescription>כמות פעמים במקום אחרון במחזורים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByLastPlace.map((player, index) => (
                  <div key={player.username} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">
                        {player.lastPlaceCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                שיאים אישיים
              </CardTitle>
              <CardDescription>הישג הניחושים הטוב ביותר במחזור בודד</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedByRecord.map((player, index) => (
                  <div key={player.username} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-lg mr-2">#{index + 1}</span>
                        <span className="font-medium">{player.username}</span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">
                        {player.seasonRecord}/16
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-600" />
              טוטומטים (הזנה ידנית)
            </CardTitle>
            <CardDescription>כמות הטוטומטים שנעשו השנה</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playerStats
                .sort((a, b) => b.totalTotomat - a.totalTotomat)
                .map((player, index) => (
                <div key={player.username} className={`p-3 rounded-lg border ${getPositionColor(index)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium text-lg mr-2">#{index + 1}</span>
                      <span className="font-medium">{player.username}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {player.totalTotomat}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                    <th className="text-center p-2">סך ניחושים</th>
                    <th className="text-center p-2">מקום ראשון</th>
                    <th className="text-center p-2">מקום אחרון</th>
                    <th className="text-center p-2">שיא אישי</th>
                    <th className="text-center p-2">טוטומטים</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((player) => (
                    <tr key={player.username} className="border-b hover:bg-gray-50">
                      <td className="font-medium p-2">{player.username}</td>
                      <td className="text-center p-2">{player.totalCorrectGuesses}</td>
                      <td className="text-center p-2">{player.firstPlaceCount}</td>
                      <td className="text-center p-2 text-red-600">{player.lastPlaceCount}</td>
                      <td className="text-center p-2">{player.seasonRecord}/16</td>
                      <td className="text-center p-2">{player.totalTotomat}</td>
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
