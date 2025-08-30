-- הארכת דדליין המחזור הנוכחי עד היום בשעה 15:00 שעון ישראל (12:00 UTC)
UPDATE toto_rounds 
SET deadline = '2025-08-30 12:00:00+00'::timestamp with time zone
WHERE id = '5e6104b2-4a1a-4471-adfe-6bc91d3ca057' AND round_number = 3;