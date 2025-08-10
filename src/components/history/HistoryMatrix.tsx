import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isHit, cellClass } from '@/lib/results';
import { useRoundData } from '@/hooks/useRoundResults';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Skeleton } from '@/components/ui/skeleton';

interface HistoryMatrixProps {
  roundId: string;
}

export default function HistoryMatrix({ roundId }: HistoryMatrixProps) {
  const { data: roundData, isLoading } = useRoundData(roundId);
  const { data: profiles } = useUserProfiles();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>מטריצת תוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!roundData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>מטריצת תוצאות</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">לא נמצאו נתונים למחזור זה</p>
        </CardContent>
      </Card>
    );
  }

  const { games, tickets, predictions } = roundData;

  // מיפוי: betId → gameId → [picks]
  const picksMap = new Map<string, Map<string, string[]>>();
  const doublesMap = new Map<string, Set<string>>();

  for (const p of predictions) {
    const betId = String(p.bet_id);
    if (!picksMap.has(betId)) picksMap.set(betId, new Map());
    if (!doublesMap.has(betId)) doublesMap.set(betId, new Set());
    
    const gameMap = picksMap.get(betId)!;
    gameMap.set(p.game_id, p.predictions);
    
    if (p.is_double) {
      doublesMap.get(betId)!.add(p.game_id);
    }
  }

  // מיפוי שמות משתמשים
  const getUserName = (userId: string) => {
    const profile = profiles?.find(p => p.id === userId);
    return profile?.name || 'משתמש לא ידוע';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>מטריצת תוצאות - מחזור {roundId.slice(0, 8)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border rounded-xl max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                <th className="p-3 text-right min-w-48 bg-muted/50">משחק</th>
                {tickets.map(t => (
                  <th key={t.id} className="p-3 text-center min-w-20 bg-muted/50">
                    {getUserName(t.user_id)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((game, idx) => (
                <tr key={game.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{idx + 1}. {game.home_team} - {game.away_team}</span>
                      {game.result && (
                        <span className="text-xs text-muted-foreground">
                          תוצאה: <span className="font-semibold">{game.result}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  {tickets.map(ticket => {
                    const picks = picksMap.get(String(ticket.id))?.get(game.id);
                    const isDouble = doublesMap.get(String(ticket.id))?.has(game.id);
                    const hit = isHit(picks as any, game.result as any);
                    
                    return (
                      <td key={ticket.id} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center justify-center min-w-12 px-2 py-1 rounded text-xs font-medium border ${cellClass(hit)}`}>
                            {picks?.join(' / ') || '—'}
                          </span>
                          {isDouble && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              כפול
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              פגיעה
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              החטאה
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted border border-muted rounded"></div>
              אין תוצאה
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}