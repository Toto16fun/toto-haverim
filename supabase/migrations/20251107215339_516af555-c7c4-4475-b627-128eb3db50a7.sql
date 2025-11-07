-- Create a secure function to handle league joining
CREATE OR REPLACE FUNCTION join_league_with_code(
  p_user_id UUID,
  p_join_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_league_id UUID;
  v_is_first_member BOOLEAN;
  v_result JSON;
BEGIN
  -- Find the league by join code
  SELECT id INTO v_league_id
  FROM leagues
  WHERE join_code = p_join_code;
  
  IF v_league_id IS NULL THEN
    RAISE EXCEPTION 'קוד הצטרפות לא תקין';
  END IF;
  
  -- Check if this is the first member
  SELECT NOT EXISTS (
    SELECT 1 FROM profiles WHERE league_id = v_league_id
  ) INTO v_is_first_member;
  
  -- Update user's profile with the new league
  UPDATE profiles
  SET league_id = v_league_id
  WHERE id = p_user_id;
  
  -- If this is the first member, make them a league admin
  IF v_is_first_member THEN
    INSERT INTO league_admins (league_id, user_id)
    VALUES (v_league_id, p_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'league_id', v_league_id,
    'is_first_member', v_is_first_member
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;