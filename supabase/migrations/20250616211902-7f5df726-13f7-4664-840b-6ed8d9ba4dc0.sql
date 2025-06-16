
-- מחיקת כל הנתונים הקשורים למחזור הנוכחי
-- תחילה נמחק את הניחושים
DELETE FROM public.bet_predictions 
WHERE bet_id IN (
    SELECT id FROM public.user_bets 
    WHERE round_id IN (
        SELECT id FROM public.toto_rounds 
        WHERE round_number = 1
    )
);

-- אחר כך נמחק את הטורים
DELETE FROM public.user_bets 
WHERE round_id IN (
    SELECT id FROM public.toto_rounds 
    WHERE round_number = 1
);

-- נמחק את המשחקים
DELETE FROM public.games 
WHERE round_id IN (
    SELECT id FROM public.toto_rounds 
    WHERE round_number = 1
);

-- לבסוף נמחק את המחזור עצמו
DELETE FROM public.toto_rounds 
WHERE round_number = 1;
