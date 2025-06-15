
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CurrentRoundBet {
  id: number;
  username: string;
  submissionDate: string;
  doublesUsed: number;
}

const CurrentRound = () => {
  const currentRound = 2; // This would normally come from your app state
  
  // Sample current round data
  const currentRoundBets: CurrentRoundBet[] = [
    { id: 1, username: 'דני', submissionDate: '2024-01-22 10:30', doublesUsed: 3 },
    { id: 2, username: 'מיכל', submissionDate: '2024-01-22 14:15', doublesUsed: 3 },
    { id: 3, username: 'רון', submissionDate: '2024-01-22 16:45', doublesUsed: 3 },
  ];

  const deadline = new Date();
  deadline.setDay(6); // Saturday
  deadline.setHours(13, 0, 0, 0); // 13:00

  const isDeadlinePassed = new Date() > deadline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            טורים שהוגשו ({currentRoundBets.length})
          </h2>
          
          {currentRoundBets.map((bet) => (
            <Card key={bet.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{bet.username}</h3>
                      <p className="text-sm text-gray-600">הוגש ב: {bet.submissionDate}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-600">כפולים:</div>
                    <div className="font-medium text-green-600">{bet.doublesUsed}/3</div>
                  </div>
                </div>
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
