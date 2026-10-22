(() => {
  'use strict';

  const projects = Array.isArray(window.EXPO_PROJECTS) ? window.EXPO_PROJECTS : [];
  const sortFilter = document.getElementById('sort-filter');
  const categoryFilter = document.getElementById('category-filter');
  const yearFilter = document.getElementById('year-filter');
  const searchInput = document.getElementById('project-search');
  const grid = document.getElementById('project-grid');
  const count = document.getElementById('result-count');
  const emptyState = document.getElementById('empty-state');
  const carouselStage = document.getElementById('carousel-stage');
  const announcement = document.getElementById('carousel-announcement');
  const featured = projects.filter(project => project.featured).sort((a, b) => b.date.localeCompare(a.date));
  const placeholder = 'images/photo-placeholder.svg';
  let featuredIndex = 0;
  let autoplayTimer = null;

  function createImage(project, isFeatured = false) {
    const image = document.createElement('img');
    image.src = project.image || placeholder;
    image.alt = project.imageAlt || project.title;
    image.loading = isFeatured ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      if (!image.src.endsWith('/' + placeholder)) image.src = placeholder;
    });
    return image;
  }

  function formatDate(isoDate) {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function createProjectCard(project) {
    const article = document.createElement('article');
    article.className = 'project-card';
    const link = document.createElement('a');
    link.className = 'project-card-link';
    link.href = `project.html?id=${encodeURIComponent(project.id)}`;
    link.setAttribute('aria-label', `View ${project.title}`);

    // Each tile has its own div for the photo, and its own div for the header and description.
    const imageBox = document.createElement('div');
    imageBox.className = 'project-card-image';
    imageBox.append(createImage(project));

    const infoBox = document.createElement('div');
    infoBox.className = 'project-card-info';
    const title = document.createElement('h2');
    title.textContent = project.title;
    const description = document.createElement('p');
    description.textContent = project.description;
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    const category = document.createElement('span');
    category.className = 'project-category';
    category.textContent = project.category;
    const time = document.createElement('time');
    time.dateTime = project.date;
    time.textContent = formatDate(project.date);
    meta.append(category, time);
    infoBox.append(title, description, meta);
    link.append(imageBox, infoBox);
    article.append(link);
    return article;
  }

  function renderProjects() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const category = categoryFilter.value;
    const year = yearFilter.value;
    const filtered = projects
      .filter(project => category === 'all' || project.category === category)
      .filter(project => year === 'all' || project.date.startsWith(year))
      .filter(project => [project.title, project.description, project.category]
        .some(field => field.toLocaleLowerCase().includes(query)))
      .sort((a, b) => sortFilter.value === 'newest'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date));

    grid.replaceChildren(...filtered.map(createProjectCard));
    count.textContent = `${filtered.length} project${filtered.length === 1 ? '' : 's'}`;
    emptyState.hidden = filtered.length !== 0;
  }

  function featuredCard(project) {
    const link = document.createElement('a');
    link.className = 'featured-card';
    link.href = `project.html?id=${encodeURIComponent(project.id)}`;
    const imageBox = document.createElement('div');
    imageBox.className = 'featured-image';
    imageBox.append(createImage(project, true));
    const tag = document.createElement('span');
    tag.className = 'featured-tag';
    tag.textContent = project.category;
    imageBox.append(tag);
    const heading = document.createElement('h2');
    heading.textContent = project.title;
    link.append(imageBox, heading);
    return link;
  }

  function renderCarousel() {
    if (!featured.length) {
      carouselStage.textContent = 'No featured projects yet.';
      document.getElementById('previous-featured').disabled = true;
      document.getElementById('next-featured').disabled = true;
      return;
    }
    const left = featured[(featuredIndex - 1 + featured.length) % featured.length];
    const center = featured[featuredIndex];
    const right = featured[(featuredIndex + 1) % featured.length];
    document.getElementById('feature-left').replaceChildren(featuredCard(left));
    document.getElementById('feature-center').replaceChildren(featuredCard(center));
    document.getElementById('feature-right').replaceChildren(featuredCard(right));
    announcement.textContent = `Featured project ${featuredIndex + 1} of ${featured.length}: ${center.title}`;
    carouselStage.classList.remove('is-swapping');
    // Restart the light fade animation on each slide.
    void carouselStage.offsetWidth;
    carouselStage.classList.add('is-swapping');
  }

  function moveCarousel(direction, fromUser = false) {
    if (featured.length < 2) return;
    featuredIndex = (featuredIndex + direction + featured.length) % featured.length;
    announcement.setAttribute('aria-live', fromUser ? 'polite' : 'off');
    renderCarousel();
    if (fromUser) restartAutoplay();
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function startAutoplay() {
    if (featured.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(() => moveCarousel(1), 5000);
  }

  function restartAutoplay() {
    if (!featureSection.matches(':hover') && !featureSection.contains(document.activeElement)) startAutoplay();
  }

  // Populate year choices from the actual post dates.
  [...new Set(projects.map(project => project.date.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a))
    .forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearFilter.append(option);
    });

  [sortFilter, categoryFilter, yearFilter].forEach(control => control.addEventListener('change', renderProjects));
  searchInput.addEventListener('input', renderProjects);
  document.getElementById('reset-filters').addEventListener('click', () => {
    sortFilter.value = 'newest';
    categoryFilter.value = 'all';
    yearFilter.value = 'all';
    searchInput.value = '';
    renderProjects();
    searchInput.focus();
  });

  document.getElementById('previous-featured').addEventListener('click', () => moveCarousel(-1, true));
  document.getElementById('next-featured').addEventListener('click', () => moveCarousel(1, true));
  const featureSection = document.querySelector('.featured-section');
  featureSection.addEventListener('mouseenter', stopAutoplay);
  featureSection.addEventListener('mouseleave', startAutoplay);
  featureSection.addEventListener('focusin', stopAutoplay);
  featureSection.addEventListener('focusout', event => {
    if (!featureSection.contains(event.relatedTarget)) startAutoplay();
  });
  featureSection.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveCarousel(-1, true); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveCarousel(1, true); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay(); else startAutoplay();
  });
  document.getElementById('year-now').textContent = new Date().getFullYear();
  renderProjects();
  renderCarousel();
  startAutoplay();
})();
