# Student Reviews — Setup Guide

Your site now has a **live review system**. Students sign in with Google, write a review, and it appears on your site **only after you approve it**.

Right now it's showing 3 sample reviews. Follow these 5 steps (about 10 minutes) to make it real.

---

## Step 1 — Create a free Supabase project

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub or Google
2. Click **New project**
   - **Name:** `senthil-portfolio`
   - **Database Password:** click Generate, then **save it somewhere safe**
   - **Region:** choose **Southeast Asia (Singapore)** — closest to India
3. Click **Create new project** and wait ~2 minutes while it sets up

---

## Step 2 — Create the reviews table

1. In your project, open **SQL Editor** (left sidebar) → **New query**
2. Open the file **`supabase-setup.sql`** in this folder, copy **everything**
3. Paste it into the SQL editor and click **Run**
4. You should see *Success. No rows returned* — that's correct

This creates the `reviews` table and the security rules so that:
- The public can only read reviews you've **approved**
- A logged-in student can only write/edit **their own** review
- Nobody can approve their own review

---

## Step 3 — Turn on Google login

1. Go to **Authentication** → **Sign In / Providers** → click **Google**
2. Toggle it **Enabled**
3. Supabase shows a **Callback URL** — copy it (looks like `https://xxxxx.supabase.co/auth/v1/callback`)
4. Now get your Google keys:
   - Go to **https://console.cloud.google.com** → create a project (any name)
   - Search for **"OAuth consent screen"** → set User Type **External** → fill your app name, your email → Save
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
     - Application type: **Web application**
     - **Authorized redirect URIs:** paste the Supabase Callback URL from step 3
     - Click **Create**
   - Copy the **Client ID** and **Client Secret**
5. Back in Supabase, paste the **Client ID** and **Client Secret** into the Google provider → **Save**

---

## Step 4 — Put your keys in the website

1. In Supabase go to **Project Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`
3. Open **`js/reviews.js`** in a text editor (Notepad works)
4. Replace the top two lines:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi..........';
```

5. Save the file and refresh your website

> The anon key is **safe to put in your website** — that's what it's designed for. Your database is protected by the security rules from Step 2.

---

## Step 5 — Add your live website address

Once your site is online (Netlify, GitHub Pages, your own domain):

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** your website address, e.g. `https://senthilnathan.netlify.app`
3. **Redirect URLs:** add the same address
4. In Google Cloud Console → your OAuth client → add the same address under **Authorized JavaScript origins**

**Testing on your own PC?** Don't open `index.html` by double-clicking — Google login needs a real address. Instead:
- Install the **Live Server** extension in VS Code, right-click `index.html` → *Open with Live Server*
- Then add `http://localhost:5500` to Supabase Redirect URLs and Google origins

---

## How to approve a review

When a student submits a review you'll see it in Supabase:

1. Go to **Table Editor** → **reviews**
2. You'll see the new row with **approved = false**
3. Read it. If it's good, tick the **approved** checkbox → it saves automatically
4. Refresh your website — the review is now live

To see everything waiting for you, run this in SQL Editor:

```sql
select name, course, rating, review, created_at
from reviews where approved = false
order by created_at desc;
```

To delete a bad review: Table Editor → select the row → **Delete row**.

---

## Good to know

- **One review per student.** If they submit again it updates their existing one (and goes back to pending).
- **Star rating, course and review text** are all required. Reviews must be 10–800 characters.
- **Average rating** is shown automatically above the reviews once you approve at least one.
- **Free tier** is plenty — Supabase gives 50,000 monthly active users free.
- Want to allow multiple reviews per student? Delete the `reviews_one_per_user` line in `supabase-setup.sql`.
- Want to change the course list? Edit the `COURSES` array at the top of `js/reviews.js`.

---

## If something doesn't work

| Problem | Fix |
|---|---|
| "Sign in with Google" does nothing | Keys not pasted in `js/reviews.js`, or you opened the file directly instead of through a server |
| Redirect error after Google login | Add your site address to Supabase → Authentication → URL Configuration → Redirect URLs |
| Review submits but doesn't appear | That's correct — tick **approved** in Supabase Table Editor |
| "Could not save" error | Make sure you ran the whole `supabase-setup.sql` file in Step 2 |
