
-- מחיקת כל הנתונים הקשורים למחזור הנוכחי
-- תחילה נמחק את הניחושים
DELETE FROM public.bet_predictions 
WHERE bet_id IN (
    SELECT id FROM public.user_bets 
    WHERE round_id IN (
        SELECT id FROM public.toto_rounds 
        ORDER BY round_number DESC LIMIT 1
    )
);

-- אחר כך נמחק את הטורים
DELETE FROM public.user_bets 
WHERE round_id IN (
    SELECT id FROM public.toto_rounds 
    ORDER BY round_number DESC LIMIT 1
);

-- נמחק את המשחקים
DELETE FROM public.games 
WHERE round_id IN (
    SELECT id FROM public.toto_rounds 
    ORDER BY round_number DESC LIMIT 1
);

-- לבסוף נמחק את המחזור עצמו
DELETE FROM public.toto_rounds 
WHERE id IN (
    SELECT id FROM public.toto_rounds 
    ORDER BY round_number DESC LIMIT 1
);
