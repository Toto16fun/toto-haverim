export type PickSymbol = '1' | 'X' | '2';

export function isHit(picks: PickSymbol[] | undefined, result: PickSymbol | undefined): boolean | undefined {
  if (!result || !picks || picks.length === 0) return undefined; // אין תוצאה/בחירה
  return picks.includes(result); // true=פגיעה, false=החטאה
}

export function cellClass(hit: boolean | undefined): string {
  if (hit === true) return 'bg-success/10 text-success border-success/20';
  if (hit === false) return 'bg-destructive/10 text-destructive border-destructive/20';
  return 'bg-muted/50 text-muted-foreground border-muted/20';
}

export function getHitStatus(predictions: string[], result: string | null): 'hit' | 'miss' | 'pending' {
  if (!result) return 'pending';
  return predictions.includes(result) ? 'hit' : 'miss';
}