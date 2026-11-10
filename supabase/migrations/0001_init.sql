-- Portfolio backend: projects + contact messages.
-- Run this in the Supabase SQL editor (or `supabase db push`) of a fresh project.

-- ---------------------------------------------------------------------------
-- projects: content for the Projects section, editable without touching code.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  tagline       text,
  summary       text not null,
  highlights    text[] not null default '{}',
  tech_stack    text[] not null default '{}',
  repo_url      text,
  demo_url      text,
  image_url     text,
  video_url     text,
  is_private    boolean not null default false,
  featured      boolean not null default false,
  published     boolean not null default true,
  display_order integer not null default 100,
  year          text,
  github_synced_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_order_idx on public.projects (display_order) where published;

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Anyone can read published projects; only the service role (sync script,
-- dashboard) can write.
drop policy if exists "public can read published projects" on public.projects;
create policy "public can read published projects"
  on public.projects for select
  to anon, authenticated
  using (published = true);

-- ---------------------------------------------------------------------------
-- contact_messages: submissions from the contact form.
-- The public may INSERT but never SELECT, UPDATE or DELETE.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message    text not null check (char_length(message) between 1 and 5000),
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "anyone can send a message" on public.contact_messages;
create policy "anyone can send a message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- No select policy on purpose: with RLS enabled and no policy, reads are denied
-- for anon/authenticated. Read messages from the Supabase dashboard or with the
-- service role key.

-- Belt and braces: revoke table privileges the anon role does not need.
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;

revoke all on public.projects from anon, authenticated;
grant select on public.projects to anon, authenticated;
