-- מחיקת מחזורים 4 ו-5 וכל הנתונים הקשורים אליהם

-- מחיקת הניבויים של המשחקים במחזורים אלה
DELETE FROM bet_predictions 
WHERE bet_id IN (
  SELECT id FROM user_bets 
  WHERE round_id IN (
    SELECT id FROM toto_rounds WHERE round_number IN (4, 5)
  )
);

-- מחיקת ההימורים במחזורים אלה
DELETE FROM user_bets 
WHERE round_id IN (
  SELECT id FROM toto_rounds WHERE round_number IN (4, 5)
);

-- מחיקת תוצאות המחזורים
DELETE FROM round_scores 
WHERE round_id IN (
  SELECT id FROM toto_rounds WHERE round_number IN (4, 5)
);

-- מחיקת המשחקים במחזורים אלה
DELETE FROM games 
WHERE round_id IN (
  SELECT id FROM toto_rounds WHERE round_number IN (4, 5)
);

-- מחיקת המחזורים עצמם
DELETE FROM toto_rounds WHERE round_number IN (4, 5);