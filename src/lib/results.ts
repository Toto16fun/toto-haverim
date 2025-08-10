export type PickSymbol = '1' | 'X' | '2';

export function isHit(picks: PickSymbol[] | undefined, result: PickSymbol | undefined): boolean | undefined {
  if (!result || !picks || picks.length === 0) return undefined; // אין תוצאה/בחירה
  return picks.includes(result); // true=פגיעה, false=החטאה
}

export function cellClass(hit: boolean | undefined): string {
  if (hit === true) return 'bg-green-100 text-green-800 border-green-200';
  if (hit === false) return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-muted text-muted-foreground border-muted';
}

export function getHitColor(hit: boolean | undefined): string {
  if (hit === true) return 'text-green-600';
  if (hit === false) return 'text-red-600';
  return 'text-muted-foreground';
}