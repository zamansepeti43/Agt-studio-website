create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text not null,
  email text,
  service text not null,
  budget text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.project_requests enable row level security;

-- Public visitors can submit a new request, but cannot read existing requests.
drop policy if exists "public can submit project requests" on public.project_requests;
create policy "public can submit project requests"
on public.project_requests
for insert
to anon, authenticated
with check (true);

-- Existing admin authentication/policies can be extended later to manage requests.
