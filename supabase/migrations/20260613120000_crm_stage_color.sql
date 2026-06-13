-- ============================================================================
-- BizOS — Customizable deal stages: per-stage color + safe stage deletion.
--   * Adds a `color` column to crm_stages (hex string, monday-style coding).
--   * RPC to move a stage's deals to another stage and delete it atomically,
--     bypassing the on-delete-restrict FK on crm_deals.stage_id.
-- ============================================================================

alter table public.crm_stages
  add column if not exists color text not null default '#6366f1';

-- ----------------------------------------------------------------------------
-- Move all deals from one stage to another, then delete the source stage.
-- Both stages must belong to the same pipeline of an org the caller manages.
-- ----------------------------------------------------------------------------
create or replace function public.move_deals_and_delete_stage(_stage uuid, _target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _org uuid;
  _pipeline uuid;
  _target_pipeline uuid;
begin
  if _stage = _target then
    raise exception 'target must differ from source stage';
  end if;

  select org_id, pipeline_id into _org, _pipeline
  from public.crm_stages where id = _stage;
  if _org is null then
    raise exception 'stage not found';
  end if;

  if not public.has_org_role(_org, array['owner','admin','manager']::org_role[]) then
    raise exception 'forbidden';
  end if;

  select pipeline_id into _target_pipeline
  from public.crm_stages where id = _target and org_id = _org;
  if _target_pipeline is null or _target_pipeline <> _pipeline then
    raise exception 'target stage must be in the same pipeline';
  end if;

  update public.crm_deals
  set stage_id = _target
  where stage_id = _stage and org_id = _org;

  delete from public.crm_stages where id = _stage;
end;
$$;

grant execute on function public.move_deals_and_delete_stage(uuid, uuid) to authenticated;
