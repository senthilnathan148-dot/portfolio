-- ═══════════════════════════════════════════════════════════
--  SENTHIL NATHAN PORTFOLIO — STUDENT REVIEWS
--  Run this whole file once in: Supabase → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════

-- 1 ── The reviews table ─────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  avatar_url  text,
  email       text,
  course      text not null,
  rating      int  not null check (rating between 1 and 5),
  review      text not null check (char_length(review) between 10 and 800),
  approved    boolean not null default false,   -- you flip this to true
  created_at  timestamptz not null default now()
);

-- one review per student (delete this line if you want to allow many)
create unique index if not exists reviews_one_per_user on public.reviews (user_id);

create index if not exists reviews_approved_idx on public.reviews (approved, created_at desc);


-- 2 ── Row Level Security ────────────────────────────────────
alter table public.reviews enable row level security;

-- Anyone (even logged out) can read APPROVED reviews only
drop policy if exists "public can read approved reviews" on public.reviews;
create policy "public can read approved reviews"
  on public.reviews for select
  using (approved = true);

-- A logged-in student can read their own review (even before approval,
-- so the site can show "your review is awaiting approval")
drop policy if exists "users can read own review" on public.reviews;
create policy "users can read own review"
  on public.reviews for select
  to authenticated
  using (auth.uid() = user_id);

-- A logged-in student can submit a review as themselves.
-- approved is forced to false so nobody can self-publish.
drop policy if exists "users can insert own review" on public.reviews;
create policy "users can insert own review"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id and approved = false);

-- A student can edit their own review; it goes back to pending.
drop policy if exists "users can update own review" on public.reviews;
create policy "users can update own review"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and approved = false);

-- A student can delete their own review
drop policy if exists "users can delete own review" on public.reviews;
create policy "users can delete own review"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
--  HOW YOU APPROVE A REVIEW
--  Supabase → Table Editor → reviews → tick the `approved` box → save.
--  Or run:  update public.reviews set approved = true where id = '<paste-id>';
--  To see what is waiting:
--     select name, course, rating, review from public.reviews where approved = false;
-- ═══════════════════════════════════════════════════════════
