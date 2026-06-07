-- ============================================================================
-- BizOS — Storage bucket for task attachments.
-- Object path convention: <org_id>/<task_id>/<filename>
-- Access is gated by org membership on the first path segment.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "org members read attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "org members upload attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

create policy "org members delete attachments"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attachments'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );
