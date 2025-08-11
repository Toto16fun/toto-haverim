import { isHit, cellClass } from '@/lib/results';
import { useRoundData } from '@/hooks/useRoundResults';

export default function HistoryMatrix({ roundId }: { roundId: string }) {
  const { data } = useRoundData(roundId);
  const games = data?.games ?? [];
  const tickets = data?.tickets ?? [];
  const preds = data?.preds ?? [];

  // מיפוי: betId→gameId→predictions
  const picksMap = new Map<string, Map<string, string[]>>();
  for (const p of preds) {
    const betId = String(p.bet_id);
    if (!picksMap.has(betId)) picksMap.set(betId, new Map());
    const gameMap = picksMap.get(betId)!;
    gameMap.set(p.game_id, p.predictions);
  }

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-2 text-left font-medium">משחק</th>
            {tickets.map(t => (
              <th key={t.id} className="p-2 text-center font-medium min-w-20">
                {t.userName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.map((g, idx) => (
            <tr key={g.id} className="border-t hover:bg-muted/20">
              <td className="p-2 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {idx + 1}. {g.home_team} vs {g.away_team}
                  </span>
                  {g.result && (
                    <span className="text-xs text-muted-foreground">
                      תוצאה: {g.result}
                    </span>
                  )}
                </div>
              </td>
              {tickets.map(t => {
                const picks = picksMap.get(t.id)?.get(g.id);
                const hit = isHit(picks as ('1' | 'X' | '2')[] | undefined, g.result as ('1' | 'X' | '2') | undefined);
                
                return (
                  <td key={t.id} className="p-2 text-center">
                    <span className={`inline-flex items-center justify-center min-w-10 px-2 py-1 rounded border text-xs font-medium ${cellClass(hit)}`}>
                      {picks?.join(' / ') ?? '—'}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}