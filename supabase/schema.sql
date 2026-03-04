-- Reset existing app data/schema objects before (re)creating everything below.
drop table if exists public.agent_logs cascade;
drop table if exists public.projects cascade;
drop table if exists public.leads cascade;

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  website_url text not null default '',
  company_email text,
  company_phone text,
  decision_maker_name text,
  decision_maker_title text,
  decision_maker_email text,
  decision_maker_linkedin_url text,
  employee_count text,
  status text not null default 'discovered',
  qualification_score numeric,
  qualification_reasoning text,
  redesign_blur_url text,
  redesign_full_url text,
  invoice_url text,
  communication_channel text not null default 'email',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_status_check check (
    status in (
      'discovered',
      'qualified',
      'outreach_sent',
      'interested',
      'proposal_sent',
      'invoiced',
      'paid',
      'handoff_started',
      'build_in_progress',
      'delivered',
      'success_managed',
      'rejected'
    )
  ),
  constraint leads_channel_check check (communication_channel in ('email', 'whatsapp', 'telegram'))
);

create unique index if not exists leads_title_website_idx on public.leads (title, website_url);
create index if not exists leads_status_idx on public.leads (status);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  name text not null,
  status text not null,
  build_spec_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists projects_lead_unique_idx on public.projects (lead_id);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  agent text not null,
  event_type text not null,
  level text not null default 'info',
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint agent_logs_level_check check (level in ('info', 'warning', 'error'))
);

create index if not exists agent_logs_lead_idx on public.agent_logs (lead_id, created_at desc);
create index if not exists agent_logs_agent_idx on public.agent_logs (agent, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();
