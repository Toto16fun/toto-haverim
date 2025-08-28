-- מחיקת מחזור 3 והמשחקים הקשורים אליו

-- מחיקת המשחקים במחזור 3
DELETE FROM games WHERE round_id = 'eca77aec-0db5-42af-9885-0b5ec6ac586f';

-- מחיקת מחזור 3
DELETE FROM toto_rounds WHERE id = 'eca77aec-0db5-42af-9885-0b5ec6ac586f' AND round_number = 3;