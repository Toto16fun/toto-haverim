
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
}

interface BetChoice {
  home: boolean;
  draw: boolean;
  away: boolean;
}

const SubmitBet = () => {
  const [username, setUsername] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [bets, setBets] = useState<Record<number, BetChoice>>({});
  const [doublesUsed, setDoublesUsed] = useState(0);
  const { toast } = useToast();

  // Sample matches - in a real app this would come from an API
  const matches: Match[] = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    homeTeam: `קבוצה בית ${i + 1}`,
    awayTeam: `קבוצה חוץ ${i + 1}`,
  }));

  const handleBetChange = (matchId: number, result: 'home' | 'draw' | 'away', checked: boolean) => {
    const currentBet = bets[matchId] || { home: false, draw: false, away: false };
    const newBet = { ...currentBet, [result]: checked };
    
    // Count how many options are selected for this match
    const selectedCount = Object.values(newBet).filter(Boolean).length;
    
    // Calculate total doubles used
    const newBets = { ...bets, [matchId]: newBet };
    const totalDoubles = Object.values(newBets).reduce((sum, bet) => {
      const count = Object.values(bet).filter(Boolean).length;
      return sum + Math.max(0, count - 1);
    }, 0);

    if (totalDoubles <= 3) {
      setBets(newBets);
      setDoublesUsed(totalDoubles);
    } else {
      toast({
        title: "חריגה ממגבלת הכפולים",
        description: "ניתן להשתמש במקסימום 3 כפולים",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!username.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס שם משתמש",
        variant: "destructive",
      });
      return;
    }

    // Check if all matches have at least one selection
    const incompleteMatches = matches.filter(match => {
      const bet = bets[match.id];
      return !bet || !Object.values(bet).some(Boolean);
    });

    if (incompleteMatches.length > 0) {
      toast({
        title: "טור לא מושלם",
        description: `נותרו ${incompleteMatches.length} משחקים ללא בחירה`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "הטור נשלח בהצלחה!",
      description: `הטור של ${username} למחזור ${roundNumber} נשמר`,
    });

    // Reset form
    setBets({});
    setDoublesUsed(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          חזרה לדף הראשי
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">הגשת טור טוטו</h1>
          <p className="text-gray-600">מלא את הטור שלך למחזור הנוכחי</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>פרטי הטור</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">שם המשתמש</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="הכנס את שמך..."
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="round">מספר מחזור</Label>
                <Input
                  id="round"
                  type="number"
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              כפולים שנוצלו: {doublesUsed}/3
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>16 משחקי הטוטו</CardTitle>
            <CardDescription>בחר את התוצאות הצפויות. ניתן לבחור עד 2 תוצאות במשחק (כפול)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match) => {
                const bet = bets[match.id] || { home: false, draw: false, away: false };
                const selectedCount = Object.values(bet).filter(Boolean).length;
                
                return (
                  <div key={match.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">משחק {match.id}</h3>
                      {selectedCount > 1 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          כפול
                        </span>
                      )}
                    </div>
                    <div className="text-center mb-3 text-sm text-gray-600">
                      {match.homeTeam} נגד {match.awayTeam}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`home-${match.id}`}
                          checked={bet.home}
                          onCheckedChange={(checked) => 
                            handleBetChange(match.id, 'home', checked as boolean)
                          }
                        />
                        <Label htmlFor={`home-${match.id}`} className="text-sm">
                          1 (בית)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`draw-${match.id}`}
                          checked={bet.draw}
                          onCheckedChange={(checked) => 
                            handleBetChange(match.id, 'draw', checked as boolean)
                          }
                        />
                        <Label htmlFor={`draw-${match.id}`} className="text-sm">
                          X (תיקו)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`away-${match.id}`}
                          checked={bet.away}
                          onCheckedChange={(checked) => 
                            handleBetChange(match.id, 'away', checked as boolean)
                          }
                        />
                        <Label htmlFor={`away-${match.id}`} className="text-sm">
                          2 (חוץ)
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <Button onClick={handleSubmit} className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
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
