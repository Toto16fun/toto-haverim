
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GamePrediction {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  prediction: string[];
  isDouble: boolean;
}

interface UserBettingSheet {
  id: number;
  username: string;
  submissionDate: string;
  isSubmitted: boolean;
  doublesUsed: number;
  predictions: GamePrediction[];
}

const CurrentRound = () => {
  const currentRound = 2; // This would normally come from your app state
  
  // Sample current round data with full betting sheets
  const currentRoundBets: UserBettingSheet[] = [
    { 
      id: 1, 
      username: 'תומר', 
      submissionDate: '2024-01-22 10:30', 
      isSubmitted: true,
      doublesUsed: 3,
      predictions: [
        { gameId: 1, homeTeam: 'מכבי תל אביב', awayTeam: 'הפועל באר שבע', prediction: ['1'], isDouble: false },
        { gameId: 2, homeTeam: 'בני סכנין', awayTeam: 'מכבי חיפה', prediction: ['1', 'X'], isDouble: true },
        { gameId: 3, homeTeam: 'הפועל תל אביב', awayTeam: 'מכבי פתח תקווה', prediction: ['2'], isDouble: false },
        { gameId: 4, homeTeam: 'עירוני קריית שמונה', awayTeam: 'הפועל ירושלים', prediction: ['X', '2'], isDouble: true },
        { gameId: 5, homeTeam: 'מכבי נתניה', awayTeam: 'הפועל חיפה', prediction: ['1'], isDouble: false },
        { gameId: 6, homeTeam: 'אשדוד', awayTeam: 'בני ברק', prediction: ['1', '2'], isDouble: true },
        // Adding more games to reach 16
        ...Array.from({ length: 10 }, (_, i) => ({
          gameId: i + 7,
          homeTeam: `קבוצה בית ${i + 7}`,
          awayTeam: `קבוצה חוץ ${i + 7}`,
          prediction: [Math.random() > 0.5 ? '1' : '2'],
          isDouble: false
        }))
      ]
    },
    { 
      id: 2, 
      username: 'דניאל', 
      submissionDate: '2024-01-22 14:15', 
      isSubmitted: true,
      doublesUsed: 3,
      predictions: [
        { gameId: 1, homeTeam: 'מכבי תל אביב', awayTeam: 'הפועל באר שבע', prediction: ['X'], isDouble: false },
        { gameId: 2, homeTeam: 'בני סכנין', awayTeam: 'מכבי חיפה', prediction: ['1', '2'], isDouble: true },
        { gameId: 3, homeTeam: 'הפועל תל אביב', awayTeam: 'מכבי פתח תקווה', prediction: ['1'], isDouble: false },
        { gameId: 4, homeTeam: 'עירוני קריית שמונה', awayTeam: 'הפועל ירושלים', prediction: ['X', '1'], isDouble: true },
        { gameId: 5, homeTeam: 'מכבי נתניה', awayTeam: 'הפועל חיפה', prediction: ['2'], isDouble: false },
        { gameId: 6, homeTeam: 'אשדוד', awayTeam: 'בני ברק', prediction: ['X', '2'], isDouble: true },
        // Adding more games to reach 16
        ...Array.from({ length: 10 }, (_, i) => ({
          gameId: i + 7,
          homeTeam: `קבוצה בית ${i + 7}`,
          awayTeam: `קבוצה חוץ ${i + 7}`,
          prediction: [Math.random() > 0.5 ? 'X' : '1'],
          isDouble: false
        }))
      ]
    },
    { 
      id: 3, 
      username: 'עילאי', 
      submissionDate: '2024-01-22 16:45', 
      isSubmitted: true,
      doublesUsed: 3,
      predictions: [
        { gameId: 1, homeTeam: 'מכבי תל אביב', awayTeam: 'הפועל באר שבע', prediction: ['2'], isDouble: false },
        { gameId: 2, homeTeam: 'בני סכנין', awayTeam: 'מכבי חיפה', prediction: ['X'], isDouble: false },
        { gameId: 3, homeTeam: 'הפועל תל אביב', awayTeam: 'מכבי פתח תקווה', prediction: ['1', 'X'], isDouble: true },
        { gameId: 4, homeTeam: 'עירוני קריית שמונה', awayTeam: 'הפועל ירושלים', prediction: ['2'], isDouble: false },
        { gameId: 5, homeTeam: 'מכבי נתניה', awayTeam: 'הפועל חיפה', prediction: ['1', '2'], isDouble: true },
        { gameId: 6, homeTeam: 'אשדוד', awayTeam: 'בני ברק', prediction: ['X', '1'], isDouble: true },
        // Adding more games to reach 16
        ...Array.from({ length: 10 }, (_, i) => ({
          gameId: i + 7,
          homeTeam: `קבוצה בית ${i + 7}`,
          awayTeam: `קבוצה חוץ ${i + 7}`,
          prediction: [Math.random() > 0.5 ? '2' : 'X'],
          isDouble: false
        }))
      ]
    },
  ];

  // Calculate next Saturday at 13:00
  const getNextSaturday = () => {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(13, 0, 0, 0);
    return nextSaturday;
  };

  const deadline = getNextSaturday();
  const isDeadlinePassed = new Date() > deadline;

  const formatPrediction = (prediction: string[]) => {
    return prediction.join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">מחזור נוכחי - מחזור {currentRound}</h1>
          <p className="text-gray-600">טורים שהוגשו במחזור הנוכחי</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              מועד אחרון להגשה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-green-600'}`}>
              {isDeadlinePassed ? 'המועד האחרון להגשה עבר' : 'עד יום שבת בשעה 13:00'}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              זמן ישראל - לאחר השעה הזו לא ניתן להגיש או לערוך טורים
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            טורים שהוגשו ({currentRoundBets.length})
          </h2>
          
          {currentRoundBets.map((userBet) => (
            <Card key={userBet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{userBet.username}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {userBet.isSubmitted ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 ml-1" />
                            נשלח ב: {userBet.submissionDate}
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 ml-1" />
                            לא נשלח
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-600">כפולים:</div>
                    <div className="font-medium text-green-600">{userBet.doublesUsed}/3</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">משחק</TableHead>
                      <TableHead className="text-right">קבוצות</TableHead>
                      <TableHead className="text-right">ניחוש</TableHead>
                      <TableHead className="text-right">כפול</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBet.predictions.map((prediction) => (
                      <TableRow key={prediction.gameId}>
                        <TableCell className="font-medium">{prediction.gameId}</TableCell>
                        <TableCell className="text-right">
                          {prediction.homeTeam} נגד {prediction.awayTeam}
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          {formatPrediction(prediction.prediction)}
                        </TableCell>
                        <TableCell className="text-right">
                          {prediction.isDouble ? (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              כפול
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {currentRoundBets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">עדיין לא הוגשו טורים במחזור הנוכחי</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentRound;
