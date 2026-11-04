# Expo Portfolio - Supabase edition

Responsive HTML/CSS/vanilla-JS portfolio with public project tiles, auto-rotating featured posts, account signup/login, author-only create/edit/delete, and one converted WebP photo per project.

No npm, git, build process, or backend hosting required for the frontend. You **do** need your own Supabase project and a web server (localhost or HTTPS). The website is not connected to anyone's account until you supply your own Supabase URL and publishable key.

## Step 1 - Create a Supabase project

1. Open https://supabase.com/dashboard and create a new project.
2. In **Project Settings > API Keys**, locate your `sb_publishable_...` key. Copy only the publishable key, **never** a secret or service_role key. Find your Project URL under **Project Settings > Data API** or project settings (dashboard labels sometimes change).
3. In `supabase-config.js`, replace `https://YOUR-PROJECT.supabase.co` and `sb_publishable_REPLACE_ME` with your own values. Leave `bucket: 'project-photos'` unchanged.

The public/publishable key is intentionally visible in the client. Security comes from Row Level Security (RLS) and the restricted database grants in the SQL below.

## Step 2 - Create the photo bucket

Supabase dashboard > **Storage > New Bucket**:

- Name: `project-photos`
- **Public** bucket: ON (project pictures are meant to be visible to visitors)
- Restrict MIME types to **`image/webp`**
- File size limit: **2 MB**

The browser resizes a chosen photo to a maximum side length of 1400 pixels, converts it to WebP, and refuses photos that remain over 2 MB. Only one named file exists *per project* (`<user ID>/<project ID>.webp`). Replacements overwrite the same file.

## Step 3 - Install the database schema and security policies

Dashboard > **SQL Editor > New query**. Paste the contents of `supabase/setup.sql` and select **Run**.

This script creates `public.projects` and turns on RLS. Visitors may read the projects table. Only a signed-in author may insert, change, or delete their own posts. Storage policies allow authors to write only in their own directory. Only privileged administrators may change the `featured` flag; users cannot feature themselves.

**Run the SQL once** in a new project. If you have an existing table/policies, review it carefully instead of applying blindly.

## Step 4 - Configure login/confirmation URLs

Supabase dashboard > **Authentication > Providers > Email**: enable Email. Keep Confirm Email enabled if you want people to verify their email addresses.

Authentication > **URL Configuration**:
- Site URL while developing: `http://localhost:8000`
- Redirect URLs: `http://localhost:8000/login.html`
- After publishing the website to GitHub Pages or another host, set your production Site URL and add `https://YOUR-DOMAIN/YOUR-PATH/login.html` to redirect URLs.

If this should be members-only, don't leave open public signups on production: disable public signup and invite/approve the chapter's accounts in Auth (an administrative decision).

## Step 5 - Run a local server

On Windows in VS Code, open the extracted folder and run in PowerShell:

```powershell
py -m http.server 8000
```

Visit `http://localhost:8000`. You can also use the VS Code Live Server extension, but set the redirect URL above to its actual local address. **Do not use `file://`** by double-clicking your HTML for live authentication.

## Step 6 - End-to-end test

1. Open `login.html` and create a test account. Confirm by email if enabled, then sign in.
2. In the navbar, click **CREATE POST**.
3. Provide a title, category, several sentences, and one image; click **Publish post**.
4. The post gets a UUID detail page (`project.html?id=...`) and automatically appears in the main grid, newest-first.
5. As the author, the detail page offers **Edit your post**. Change text or replace the photo; the path stays the same.
6. Sign out. The post remains public, while edit/create controls disappear. Sign in as a different account: that account cannot update or delete the original author's post.
7. In Supabase **Table Editor**, verify a row exists in `public.projects`; in Storage, verify one `webp` file at `project-photos/<user ID>/<post ID>.webp`.

## Step 7 - Feature a post

Featured posts are chapter-curated: a dashboard administrator can set `featured = true` in **Table Editor**, or use SQL Editor:

```sql
update public.projects set featured = true where id = 'YOUR-POST-UUID';
```

The home-page featured carousel rotates through `featured = true` posts every 5 seconds. It will show “No featured projects yet” until at least one post is featured.

## Site structure

- `index.html` + `script.js`: home-page cards, sorting, search, featured carousel
- `project.html` + `project.js`: public project details, author edit link
- `login.html` + `auth.js`: email/password signup and login
- `create-post.html` + `create-post.js`: create, edit, replace image, delete
- `supabase-config.js`: your Project URL and **publishable** key
- `supabase-client.js`: browser Supabase client and shared project mapping
- `session-nav.js`: shared account links / sign out
- `styles.css`: styles, including hover effects
- `projects.js`: **demo fallback ONLY**; hidden as soon as Supabase is configured
- `supabase/setup.sql`: table security + storage upload policies

## Important limitations before a public production launch

- This static client is a starter. It relies on RLS and column-level grants to protect post ownership and featured status. Restrict production signup or add an approval system if only chapter members should be able to post.
- Public Storage allows anyone with the image URL to view it (appropriate for published projects).
- The browser enforces one active WebP file path per post, but it is not a quota enforcement system against deliberate abuse. For strict usage limits, add server-side moderation, abuse protection, and periodic cleanup.
- Editing an image overwrites the stored file first. If the subsequent database update fails, the image may already have changed. Deleting a post removes its database record first, then the image; rare cleanup failures need admin attention.
- No project records are migrated from `projects.js`; you'll create new records with the form.
- Browser CDN loading requires internet. If the CDN cannot load, use a hosted/locally bundled copy of supabase-js v2.
