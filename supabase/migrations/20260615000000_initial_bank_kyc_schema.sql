create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.agents (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'agent' check (role in ('agent', 'supervisor', 'admin')),
  branch_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  session_id text not null unique,
  nida_number text,
  full_name text,
  date_of_birth date,
  expiry_date date,
  payload jsonb not null,
  submission_status text not null default 'queued' check (
    submission_status in ('draft', 'queued', 'submitted', 'synced', 'rejected', 'failed')
  ),
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.agents (id) on delete cascade,
  submission_id uuid references public.kyc_submissions (id) on delete set null,
  event_type text not null constraint audit_logs_event_type_check check (
    event_type in (
      'scan_started',
      'scan_completed',
      'validation_completed',
      'sync_queued',
      'sync_started',
      'sync_completed',
      'sync_failed',
      'sync_retry_scheduled',
      'submitted',
      'synced',
      'rejected'
    )
  ),
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  submission_id uuid references public.kyc_submissions (id) on delete set null,
  session_id text not null,
  device_id text,
  event_type text not null check (event_type in ('queued', 'retry', 'synced', 'failed')),
  sync_status text not null default 'pending' check (sync_status in ('pending', 'synced', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_synced_at timestamptz,
  payload_hash text not null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_kyc_submissions_agent_id on public.kyc_submissions (agent_id);
create index if not exists idx_kyc_submissions_session_id on public.kyc_submissions (session_id);
create index if not exists idx_kyc_submissions_sync_status on public.kyc_submissions (sync_status);
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_submission_id on public.audit_logs (submission_id);
create index if not exists idx_sync_events_agent_id on public.sync_events (agent_id);
create index if not exists idx_sync_events_session_id on public.sync_events (session_id);
create index if not exists idx_sync_events_sync_status on public.sync_events (sync_status);

create trigger set_agents_updated_at
before update on public.agents
for each row
execute function public.set_updated_at();

create trigger set_kyc_submissions_updated_at
before update on public.kyc_submissions
for each row
execute function public.set_updated_at();

alter table public.agents enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sync_events enable row level security;

create policy "agents_select_self"
on public.agents
for select
using (id = auth.uid());

create policy "agents_insert_self"
on public.agents
for insert
with check (id = auth.uid());

create policy "agents_update_self"
on public.agents
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "kyc_submissions_select_own"
on public.kyc_submissions
for select
using (agent_id = auth.uid());

create policy "kyc_submissions_insert_own"
on public.kyc_submissions
for insert
with check (agent_id = auth.uid());

create policy "kyc_submissions_update_own"
on public.kyc_submissions
for update
using (agent_id = auth.uid())
with check (agent_id = auth.uid());

create policy "audit_logs_select_own"
on public.audit_logs
for select
using (actor_id = auth.uid());

create policy "audit_logs_insert_own"
on public.audit_logs
for insert
with check (actor_id = auth.uid());

create policy "sync_events_select_own"
on public.sync_events
for select
using (agent_id = auth.uid());

create policy "sync_events_insert_own"
on public.sync_events
for insert
with check (agent_id = auth.uid());

create policy "sync_events_update_own"
on public.sync_events
for update
using (agent_id = auth.uid())
with check (agent_id = auth.uid());
