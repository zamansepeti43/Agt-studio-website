-- Admin panel permissions for incoming project requests.
-- The public form keeps INSERT access; only users accepted by public.is_admin() can read/update requests.

grant select, update on table public.project_requests to authenticated;

drop policy if exists "admin can read project requests" on public.project_requests;
create policy "admin can read project requests"
on public.project_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "admin can update project requests" on public.project_requests;
create policy "admin can update project requests"
on public.project_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
