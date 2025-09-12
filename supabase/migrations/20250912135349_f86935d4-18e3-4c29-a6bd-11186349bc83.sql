-- עדכון דדליין של המחזור הפעיל הנוכחי לשבת 13:00 שעון ישראל
DO $$
DECLARE
    current_round_id uuid;
    next_saturday_deadline timestamp with time zone;
    now_date date := CURRENT_DATE;
    year_val integer := EXTRACT(YEAR FROM now_date);
    last_friday_march date;
    last_sunday_october date;
    is_dst boolean;
    days_to_saturday integer;
    target_date date;
BEGIN
    -- מצא את המחזור הפעיל הנוכחי
    SELECT id INTO current_round_id 
    FROM toto_rounds 
    WHERE status = 'active' 
    ORDER BY round_number DESC 
    LIMIT 1;
    
    IF current_round_id IS NOT NULL THEN
        -- חישוב DST לישראל (שעון קיץ מהשישי האחרון במרץ עד הראשון האחרון באוקטובר)
        
        -- השישי האחרון במרץ
        last_friday_march := (DATE_TRUNC('month', (year_val || '-03-01')::date) + INTERVAL '1 month - 1 day')::date;
        WHILE EXTRACT(DOW FROM last_friday_march) != 5 LOOP
            last_friday_march := last_friday_march - 1;
        END LOOP;
        
        -- הראשון האחרון באוקטובר  
        last_sunday_october := (DATE_TRUNC('month', (year_val || '-10-01')::date) + INTERVAL '1 month - 1 day')::date;
        WHILE EXTRACT(DOW FROM last_sunday_october) != 0 LOOP
            last_sunday_october := last_sunday_october - 1;
        END LOOP;
        
        -- בדוק אם אנחנו בשעון קיץ
        is_dst := now_date >= last_friday_march AND now_date < last_sunday_october;
        
        -- חישוב השבת הבאה
        days_to_saturday := (6 - EXTRACT(DOW FROM now_date)::integer + 7) % 7;
        IF days_to_saturday = 0 THEN
            days_to_saturday := 7;
        END IF;
        
        target_date := now_date + days_to_saturday;
        
        -- קבע את הזמן בהתאם לשעון קיץ/חורף
        -- שעון קיץ (UTC+3): 13:00 ישראל = 10:00 UTC
        -- שעון חורף (UTC+2): 13:00 ישראל = 11:00 UTC
        IF is_dst THEN
            next_saturday_deadline := target_date + TIME '10:00:00';
        ELSE
            next_saturday_deadline := target_date + TIME '11:00:00';
        END IF;
        
        -- עדכן את הדדליין
        UPDATE toto_rounds 
        SET deadline = next_saturday_deadline 
        WHERE id = current_round_id;
        
        RAISE NOTICE 'עודכן דדליין של מחזור % ל-%', current_round_id, next_saturday_deadline;
    ELSE
        RAISE NOTICE 'לא נמצא מחזור פעיל לעדכון';
    END IF;
END $$;