# Expo Portfolio website

A responsive demo based on the supplied wireframe. Works as a static site with no build tools required.

## Get started

1. Unzip the folder.
2. Double-click **index.html** in your browser.
3. Or open this folder in VS Code and run it with a local server (Live Server is optional).

## What works

- Featured carousel automatically cycles every **5 seconds**, with manual previous/next controls. It pauses when hovered or focused, and respects reduced-motion preferences.
- Project tiles gently enlarge on hover and keyboard focus.
- Date sorting is **newest to oldest by default**, or oldest to newest.
- Category, year, and keyword filters work together.
- Navigation goes to the included **About Us** and **Rush** pages.
- Clicking a featured post or project tile opens its own project page (`project.html?id=...`).
- Responsive desktop, tablet, and mobile layouts.

## Add or edit projects

Edit **projects.js**. Each object contains these properties:

```js
{
  id: 'my-project',                            // unique slug
  title: 'My Project',
  description: 'A few sentences about it.',
  category: 'Engineering',                     // or Technology / Community
  date: '2026-10-22',                          // YYYY-MM-DD; controls sorting
  image: 'images/my-project.webp',             // one photo per project
  imageAlt: 'Description of the photo',
  featured: true                               // true = include in carousel
}
```

Put your own WebP pictures in the **images** folder. For example, add `images/my-project.webp` and change the `image` field accordingly. The default sample cards currently reference Unsplash photos (which need an internet connection). When an image can't load, a local placeholder image appears instead.

To change the categories, update both the `<select id="category-filter">` options in **index.html** and the relevant `category` fields in **projects.js**.

## Later: database and login

This version is a **front-end demo**: project data lives in `projects.js`, so changes are made by editing that file. It does not yet save user posts or authenticate users. When ready, the same card and carousel layout can be connected to Supabase Auth, a `projects` table, and a Storage bucket for **one resized WebP photo per post**. Each project has a stable `id`, which makes that migration straightforward. Never put a Supabase `service_role` key in browser JavaScript.
