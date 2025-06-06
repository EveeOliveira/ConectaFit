-- Create a function to delete a workout plan and its exercises in a transaction
create or replace function delete_workout_plan(p_workout_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Start transaction
  begin
    -- Delete related exercises first
    delete from workout_exercises
    where workout_plan_id = p_workout_id;

    -- Then delete the workout plan
    delete from workout_plans
    where id = p_workout_id;

    -- If we get here, both operations succeeded
    return;
  exception
    when others then
      -- If any error occurs, rollback the transaction
      raise exception 'Error deleting workout plan: %', sqlerrm;
  end;
end;
$$; 