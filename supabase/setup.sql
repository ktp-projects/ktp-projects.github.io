-- Run this in Supabase Dashboard > SQL Editor AFTER making the public
-- Storage bucket named project-photos (2 MB; image/webp only).
-- This setup assumes no pre-existing public.projects table or conflicting policies.

create table if not exists public.projects (
  id uuid primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 1000),
  category text not null check (category in ('Engineering', 'Technology', 'Community')),
  image_path text not null,
  image_alt text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  image_updated_at timestamptz not null default now(),
  constraint one_image_path_per_project check (
    image_path = author_id::text || '/' || id::text || '.webp'
  )
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_featured_idx on public.projects (featured, created_at desc);
alter table public.projects enable row level security;

-- Column grants keep featured/owner/image_path/created_at privileged.
-- App users may not feature their own posts by changing their JavaScript.
revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert (id, author_id, title, description, category, image_path, image_alt)
  on table public.projects to authenticated;
grant update (title, description, category, image_alt, updated_at, image_updated_at)
  on table public.projects to authenticated;
grant delete on table public.projects to authenticated;

create policy "Anyone can read projects"
  on public.projects for select to anon, authenticated using (true);
create policy "Authors can create posts"
  on public.projects for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors can update own posts"
  on public.projects for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy "Authors can delete own posts"
  on public.projects for delete to authenticated
  using (author_id = (select auth.uid()));

-- In public buckets file URLs are public, but writes still require policies.
-- Each author's photo path must start with their UID directory.
create policy "Authors can upload their WebP photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and storage.filename(name) ~* '^[0-9a-f-]{36}\.webp$'
    and owner_id = (select auth.uid()::text)
  );
create policy "Authors can read their storage objects for replacement"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );
create policy "Authors can replace their WebP photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );
create policy "Authors can remove their WebP photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );

-- To feature a post, a chapter administrator can use SQL Editor:
-- update public.projects set featured = true where id = 'YOUR-POST-UUID';
