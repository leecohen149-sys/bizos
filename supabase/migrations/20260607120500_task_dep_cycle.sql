-- ============================================================================
-- BizOS — Prevent dependency cycles (DB safety net; app also checks client-side).
-- Edge semantics: predecessor_task_id "blocks" successor_task_id.
-- A cycle is created if the new successor can already reach the predecessor.
-- ============================================================================
create or replace function public.prevent_dependency_cycle()
returns trigger
language plpgsql
as $$
declare
  _cycle boolean;
begin
  if new.type <> 'blocks' then
    return new;
  end if;

  with recursive reach as (
    select successor_task_id as node
    from public.task_dependencies
    where predecessor_task_id = new.successor_task_id and type = 'blocks'
    union
    select d.successor_task_id
    from public.task_dependencies d
    join reach r on d.predecessor_task_id = r.node
    where d.type = 'blocks'
  )
  select exists (select 1 from reach where node = new.predecessor_task_id)
    into _cycle;

  if _cycle then
    raise exception 'dependency cycle detected' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists task_dep_no_cycle on public.task_dependencies;
create trigger task_dep_no_cycle
  before insert or update on public.task_dependencies
  for each row execute function public.prevent_dependency_cycle();
