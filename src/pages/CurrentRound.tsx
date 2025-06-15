
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
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
  const currentRound = 2;
  const [showComparison, setShowComparison] = useState(true);
  
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
        { gameId: 7, homeTeam: 'קבוצה בית 7', awayTeam: 'קבוצה חוץ 7', prediction: ['1'], isDouble: false },
        { gameId: 8, homeTeam: 'קבוצה בית 8', awayTeam: 'קבוצה חוץ 8', prediction: ['2'], isDouble: false },
        { gameId: 9, homeTeam: 'קבוצה בית 9', awayTeam: 'קבוצה חוץ 9', prediction: ['X'], isDouble: false },
        { gameId: 10, homeTeam: 'קבוצה בית 10', awayTeam: 'קבוצה חוץ 10', prediction: ['1'], isDouble: false },
        { gameId: 11, homeTeam: 'קבוצה בית 11', awayTeam: 'קבוצה חוץ 11', prediction: ['2'], isDouble: false },
        { gameId: 12, homeTeam: 'קבוצה בית 12', awayTeam: 'קבוצה חוץ 12', prediction: ['X'], isDouble: false },
        { gameId: 13, homeTeam: 'קבוצה בית 13', awayTeam: 'קבוצה חוץ 13', prediction: ['1'], isDouble: false },
        { gameId: 14, homeTeam: 'קבוצה בית 14', awayTeam: 'קבוצה חוץ 14', prediction: ['2'], isDouble: false },
        { gameId: 15, homeTeam: 'קבוצה בית 15', awayTeam: 'קבוצה חוץ 15', prediction: ['X'], isDouble: false },
        { gameId: 16, homeTeam: 'קבוצה בית 16', awayTeam: 'קבוצה חוץ 16', prediction: ['1'], isDouble: false }
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
        { gameId: 7, homeTeam: 'קבוצה בית 7', awayTeam: 'קבוצה חוץ 7', prediction: ['X'], isDouble: false },
        { gameId: 8, homeTeam: 'קבוצה בית 8', awayTeam: 'קבוצה חוץ 8', prediction: ['1'], isDouble: false },
        { gameId: 9, homeTeam: 'קבוצה בית 9', awayTeam: 'קבוצה חוץ 9', prediction: ['X'], isDouble: false },
        { gameId: 10, homeTeam: 'קבוצה בית 10', awayTeam: 'קבוצה חוץ 10', prediction: ['1'], isDouble: false },
        { gameId: 11, homeTeam: 'קבוצה בית 11', awayTeam: 'קבוצה חוץ 11', prediction: ['2'], isDouble: false },
        { gameId: 12, homeTeam: 'קבוצה בית 12', awayTeam: 'קבוצה חוץ 12', prediction: ['X'], isDouble: false },
        { gameId: 13, homeTeam: 'קבוצה בית 13', awayTeam: 'קבוצה חוץ 13', prediction: ['1'], isDouble: false },
        { gameId: 14, homeTeam: 'קבוצה בית 14', awayTeam: 'קבוצה חוץ 14', prediction: ['2'], isDouble: false },
        { gameId: 15, homeTeam: 'קבוצה בית 15', awayTeam: 'קבוצה חוץ 15', prediction: ['X'], isDouble: false },
        { gameId: 16, homeTeam: 'קבוצה בית 16', awayTeam: 'קבוצה חוץ 16', prediction: ['1'], isDouble: false }
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
        { gameId: 7, homeTeam: 'קבוצה בית 7', awayTeam: 'קבוצה חוץ 7', prediction: ['2'], isDouble: false },
        { gameId: 8, homeTeam: 'קבוצה בית 8', awayTeam: 'קבוצה חוץ 8', prediction: ['X'], isDouble: false },
        { gameId: 9, homeTeam: 'קבוצה בית 9', awayTeam: 'קבוצה חוץ 9', prediction: ['2'], isDouble: false },
        { gameId: 10, homeTeam: 'קבוצה בית 10', awayTeam: 'קבוצה חוץ 10', prediction: ['X'], isDouble: false },
        { gameId: 11, homeTeam: 'קבוצה בית 11', awayTeam: 'קבוצה חוץ 11', prediction: ['2'], isDouble: false },
        { gameId: 12, homeTeam: 'קבוצה בית 12', awayTeam: 'קבוצה חוץ 12', prediction: ['X'], isDouble: false },
        { gameId: 13, homeTeam: 'קבוצה בית 13', awayTeam: 'קבוצה חוץ 13', prediction: ['2'], isDouble: false },
        { gameId: 14, homeTeam: 'קבוצה בית 14', awayTeam: 'קבוצה חוץ 14', prediction: ['X'], isDouble: false },
        { gameId: 15, homeTeam: 'קבוצה בית 15', awayTeam: 'קבוצה חוץ 15', prediction: ['2'], isDouble: false },
        { gameId: 16, homeTeam: 'קבוצה בית 16', awayTeam: 'קבוצה חוץ 16', prediction: ['X'], isDouble: false }
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

  const renderPredictionButtons = (prediction: string[], isDouble: boolean) => {
    const options = ['1', 'X', '2'];
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {options.map((option) => {
            const isSelected = prediction.includes(option);
            return (
              <div
                key={option}
                className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {option}
              </div>
            );
          })}
        </div>
        {isDouble && (
          <div className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
            כפול
          </div>
        )}
      </div>
    );
  };

  const renderComparisonView = () => (
    <Card className="overflow-x-auto">
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right min-w-[80px]">משחק</TableHead>
              <TableHead className="text-right min-w-[200px]">קבוצות</TableHead>
              {currentRoundBets.map((userBet) => (
                <TableHead key={userBet.id} className="text-center min-w-[120px]">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="font-semibold">{userBet.username}</div>
                    <div className="flex items-center text-xs text-gray-600">
                      {userBet.isSubmitted ? (
                        <CheckCircle className="h-3 w-3 text-green-600 ml-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600 ml-1" />
                      )}
                      {userBet.isSubmitted ? 'נשלח' : 'לא נשלח'}
                    </div>
                    <div className="text-xs text-gray-500">כפולים: {userBet.doublesUsed}/3</div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRoundBets[0]?.predictions.map((_, gameIndex) => (
              <TableRow key={gameIndex}>
                <TableCell className="text-center font-medium text-gray-600">
                  {gameIndex + 1}
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-medium">
                    {currentRoundBets[0].predictions[gameIndex].homeTeam} - {currentRoundBets[0].predictions[gameIndex].awayTeam}
                  </div>
                </TableCell>
                {currentRoundBets.map((userBet) => (
                  <TableCell key={userBet.id} className="text-center">
                    {renderPredictionButtons(
                      userBet.predictions[gameIndex].prediction,
                      userBet.predictions[gameIndex].isDouble
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderSeparateView = () => (
    <div className="space-y-6">
      {currentRoundBets.map((userBet) => (
        <Card key={userBet.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {userBet.username}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm">
                  {userBet.isSubmitted ? (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 ml-2" />
                  )}
                  {userBet.isSubmitted ? 'נשלח' : 'לא נשלח'}
                </div>
                <div className="text-sm text-gray-600">
                  כפולים: {userBet.doublesUsed}/3
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              נשלח ב-{userBet.submissionDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userBet.predictions.map((prediction, index) => (
                <div key={prediction.gameId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    {renderPredictionButtons(prediction.prediction, prediction.isDouble)}
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-sm font-medium">
                      {prediction.homeTeam} - {prediction.awayTeam}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 w-8 text-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              טורים שהוגשו ({currentRoundBets.length})
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">טורים נפרדים</span>
              <Switch
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <span className="text-sm text-gray-600">השווה טורים</span>
            </div>
          </div>
          
          {currentRoundBets.length > 0 ? (
            showComparison ? renderComparisonView() : renderSeparateView()
          ) : (
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
