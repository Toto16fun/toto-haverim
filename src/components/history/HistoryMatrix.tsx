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
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-[10px] sm:text-sm">
        <thead className="sticky top-0 z-30">
          <tr className="bg-muted/50">
            {tickets.map(t => (
              <th key={t.id} className="p-1 sm:p-2 text-center font-medium min-w-12 sm:min-w-20 text-[10px] sm:text-sm">
                <div className="truncate max-w-[60px] sm:max-w-none">
                  {t.userName}
                </div>
              </th>
            ))}
            <th className="p-1 sm:p-2 text-right font-medium text-[10px] sm:text-sm sticky right-0 bg-muted/50 z-30 shadow-[-2px_0_4px_rgba(0,0,0,0.15)]">משחק</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g, idx) => (
            <tr key={g.id} className="border-t hover:bg-muted/20">
              {tickets.map(t => {
                const picks = picksMap.get(t.id)?.get(g.id);
                const hit = isHit(picks as ('1' | 'X' | '2')[] | undefined, g.result as ('1' | 'X' | '2') | undefined);
                
                return (
                  <td key={t.id} className="p-1 sm:p-2 text-center">
                    <span className={`inline-flex items-center justify-center min-w-8 sm:min-w-10 px-1 sm:px-2 py-0.5 sm:py-1 rounded border text-[10px] sm:text-xs font-medium ${cellClass(hit)}`}>
                      {picks?.join(' / ') ?? '—'}
                    </span>
                  </td>
                );
              })}
              <td className="p-1 sm:p-2 whitespace-nowrap text-right sticky right-0 bg-background z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.15)]">
                <div className="flex flex-col gap-0.5" dir="rtl">
                  <span className="font-medium text-[10px] sm:text-sm">
                    {idx + 1}. {g.home_team} vs {g.away_team}
                  </span>
                  {g.result && (
                    <span className="text-[9px] sm:text-xs text-muted-foreground">
                      תוצאה: {g.result}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {/* Total hits row */}
          <tr className="border-t-2 bg-muted/30 font-semibold">
            {tickets.map(t => {
              // Count hits for this ticket
              let hitCount = 0;
              games.forEach(g => {
                const picks = picksMap.get(t.id)?.get(g.id);
                const hit = isHit(picks as ('1' | 'X' | '2')[] | undefined, g.result as ('1' | 'X' | '2') | undefined);
                if (hit === true) hitCount++;
              });
              
              return (
                <td key={t.id} className="p-1 sm:p-2 text-center">
                  <span className="inline-flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-800 text-[10px] sm:text-sm font-bold">
                    {hitCount}
                  </span>
                </td>
              );
            })}
            <td className="p-1 sm:p-2 text-right text-[10px] sm:text-sm sticky right-0 bg-muted/30 z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.15)]">
              ניחושים נכונים
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}