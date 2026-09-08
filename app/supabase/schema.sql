create extension if not exists "pgcrypto";

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text not null,
  email text not null,
  ic_number text not null,
  umno_member_no text not null,
  ipt_name text not null,
  graduation_year integer not null,
  ipt_zone text not null,
  umno_division text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  membership_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists membership_email_unique
  on public.membership_applications (lower(email));

create unique index if not exists membership_umno_member_unique
  on public.membership_applications (umno_member_no);

alter table public.membership_applications enable row level security;

-- The registration API uses the server-side service role key.
-- Do NOT expose SUPABASE_SERVICE_ROLE_KEY to the browser.

create or replace function public.generate_membership_id()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved'
     and old.status is distinct from 'approved'
     and new.membership_id is null then
    new.membership_id :=
      'UMS-' ||
      to_char(current_date, 'YYYY') ||
      '-' ||
      lpad(nextval('public.membership_seq')::text, 5, '0');
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create sequence if not exists public.membership_seq start 1;

drop trigger if exists trg_generate_membership_id
  on public.membership_applications;

create trigger trg_generate_membership_id
before update on public.membership_applications
for each row
execute function public.generate_membership_id();
