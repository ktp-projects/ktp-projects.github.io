(async () => {
  'use strict';
  const id = new URLSearchParams(location.search).get('id');
  const root = document.getElementById('project-content');
  const status = document.getElementById('detail-message');
  const db = window.EXPO_DB;
  let project;
  let ownerId;

  try {
    if (window.EXPO_CONFIGURED) {
      if (!db) throw new Error('Supabase could not load. Please refresh.');
      const { data, error } = await db.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      ownerId = data.author_id;
      project = window.EXPO_UTILS.asProject(data);
    } else {
      project = (window.EXPO_PROJECTS || []).find(item => item.id === id);
    }
    if (!project) throw new Error('This post does not exist or is no longer available.');
  } catch (error) {
    document.title = 'Project unavailable | Expo Portfolio';
    status.textContent = error.message;
    status.classList.add('error-text');
    return;
  }

  status.hidden = true;
  document.title = `${project.title} | Expo Portfolio`;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = `${project.category} · ${new Date(project.date + 'T12:00:00').toLocaleDateString('en-US', {dateStyle: 'long'})}`;
  const title = document.createElement('h1');
  title.textContent = project.title;
  const accent = document.createElement('div');
  accent.className = 'page-accent';
  accent.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.className = 'detail-image';
  image.alt = project.imageAlt || project.title;
  image.src = project.image || 'images/photo-placeholder.svg';
  image.addEventListener('error', () => {
    if (!image.src.endsWith('/images/photo-placeholder.svg')) image.src = 'images/photo-placeholder.svg';
  });
  const description = document.createElement('p');
  description.className = 'detail-description';
  description.textContent = project.description;
  root.append(eyebrow, title, accent, image, description);

  if (db && ownerId) {
    const { data: { user } } = await db.auth.getUser();
    if (user?.id === ownerId) {
      const edit = document.createElement('a');
      edit.className = 'primary-button detail-edit';
      edit.href = `create-post.html?id=${encodeURIComponent(id)}`;
      edit.textContent = 'Edit your post';
      root.append(edit);
    }
  }
})();
