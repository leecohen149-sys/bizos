-- ============================================================================
-- BizOS — Auto-create an in-app notification when a task is assigned to someone
-- other than the person making the change. Streams live via Realtime.
-- ============================================================================
create or replace function public.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null
     and new.assignee_id is distinct from auth.uid()
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
  then
    insert into public.notifications (org_id, user_id, type, title, body, entity_type, entity_id)
    values (
      new.org_id,
      new.assignee_id,
      'task_assigned',
      'הוקצתה לך משימה',
      new.title,
      'task',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists task_assignment_notify on public.tasks;
create trigger task_assignment_notify
  after insert or update of assignee_id on public.tasks
  for each row execute function public.notify_task_assignment();
