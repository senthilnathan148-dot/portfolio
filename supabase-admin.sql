-- ═══════════════════════════════════════════════════════════
--  ADMIN MODERATION — run this ONCE in Supabase → SQL Editor
--  Makes senthilnathan148@gmail.com the site admin, who can
--  see EVERY review and approve / hide / delete any of them.
--  (These add to the existing policies from supabase-setup.sql.)
-- ═══════════════════════════════════════════════════════════

-- Admin can READ every review (including pending / unapproved)
drop policy if exists "admin can read all reviews" on public.reviews;
create policy "admin can read all reviews"
  on public.reviews for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'senthilnathan148@gmail.com');

-- Admin can UPDATE any review (flip approved on/off)
drop policy if exists "admin can update any review" on public.reviews;
create policy "admin can update any review"
  on public.reviews for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'senthilnathan148@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'senthilnathan148@gmail.com');

-- Admin can DELETE any review
drop policy if exists "admin can delete any review" on public.reviews;
create policy "admin can delete any review"
  on public.reviews for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'senthilnathan148@gmail.com');

-- ═══════════════════════════════════════════════════════════
--  To change the admin later, replace the email in all three
--  policies above and run this file again.
-- ═══════════════════════════════════════════════════════════
