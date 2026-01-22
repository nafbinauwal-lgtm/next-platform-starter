
-- Run in Supabase SQL editor
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  full_name text null,
  company text null,
  email text null,
  phone text null,
  service text null,
  industry text null,
  jurisdiction text null,
  brief text null,
  score int not null default 0,
  tier text not null default 'Review (C)'
);

alter table public.submissions enable row level security;

create policy "public can insert submissions"
on public.submissions for insert
to anon, authenticated
with check (true);

create policy "users can read own submissions"
on public.submissions for select
to authenticated
using (user_id = auth.uid());

create policy "users can update own submissions"
on public.submissions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
