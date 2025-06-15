
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HistoricalBet {
  id: number;
  username: string;
  roundNumber: number;
  submissionDate: string;
  correctGuesses: number;
  totalGuesses: number;
  position: number;
  isPaid: boolean;
}

const History = () => {
  const [selectedRound, setSelectedRound] = useState<number | ''>('');

  // Sample historical data
  const historicalBets: HistoricalBet[] = [
    { id: 1, username: 'דני', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 12, totalGuesses: 16, position: 1, isPaid: false },
    { id: 2, username: 'יוסי', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 8, totalGuesses: 16, position: 6, isPaid: true },
    { id: 3, username: 'מיכל', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 10, totalGuesses: 16, position: 3, isPaid: false },
    { id: 4, username: 'רון', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 11, totalGuesses: 16, position: 2, isPaid: false },
    { id: 5, username: 'אבי', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 9, totalGuesses: 16, position: 4, isPaid: false },
    { id: 6, username: 'גיל', roundNumber: 1, submissionDate: '2024-01-15', correctGuesses: 9, totalGuesses: 16, position: 5, isPaid: false },
  ];

  const filteredBets = selectedRound 
    ? historicalBets.filter(bet => bet.roundNumber === selectedRound)
    : historicalBets;

  const rounds = [...new Set(historicalBets.map(bet => bet.roundNumber))].sort((a, b) => b - a);

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-800 bg-gray-100';
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
          <h1 className="text-3xl font-bold text-green-800 mb-2">היסטוריית שליחות</h1>
          <p className="text-gray-600">צפה בטורים של כל המחזורים ובתוצאות</p>
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
                variant={selectedRound === '' ? 'default' : 'outline'}
                onClick={() => setSelectedRound('')}
              >
                כל המחזורים
              </Button>
              {rounds.map(round => (
                <Button
                  key={round}
                  variant={selectedRound === round ? 'default' : 'outline'}
                  onClick={() => setSelectedRound(round)}
                >
                  מחזור {round}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBets.map((bet) => (
            <Card key={bet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{bet.username}</CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(bet.position)}`}>
                    מקום {bet.position}
                  </div>
                </div>
                <CardDescription>מחזור {bet.roundNumber} • {bet.submissionDate}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ניחושים נכונים:</span>
                  <span className="font-medium text-green-600">
                    {bet.correctGuesses}/{bet.totalGuesses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">אחוז הצלחה:</span>
                  <span className="font-medium">
                    {Math.round((bet.correctGuesses / bet.totalGuesses) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">סטטוס תשלום:</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    bet.isPaid 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {bet.isPaid ? 'משלם בסיבוב הבא' : 'לא משלם'}
                  </span>
                </div>
                {bet.position === 1 && (
                  <div className="flex items-center text-yellow-600 text-sm">
                    <Trophy className="h-4 w-4 mr-1" />
                    זוכה המחזור!
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBets.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">לא נמצאו טורים עבור המחזור שנבחר</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;
