-- The current RLS policy already allows viewing all predictions, which is correct for the Current Round page
-- No changes needed to bet_predictions table - the functionality works as intended
-- Users can see all betting predictions in the Current Round page, which is the desired behavior

SELECT 'No migration needed - current RLS policies are correct for the intended functionality' as status;