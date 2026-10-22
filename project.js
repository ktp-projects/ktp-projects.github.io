(() => {
  const id = new URLSearchParams(window.location.search).get('id');
  const project = (window.EXPO_PROJECTS || []).find(item => item.id === id);
  const root = document.getElementById('project-content');
  if (!project) {
    document.title = 'Project not found | Expo Portfolio';
    const title = document.createElement('h1');
    title.textContent = 'Project not found';
    const paragraph = document.createElement('p');
    paragraph.textContent = 'This project does not exist or is no longer available.';
    root.append(title, paragraph);
    return;
  }
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
})();
