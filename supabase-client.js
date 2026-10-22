(() => {
  'use strict';
  const config = window.EXPO_CONFIG || {};
  const configured = Boolean(
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '') &&
    config.publishableKey && !config.publishableKey.includes('REPLACE_ME') &&
    !config.url.includes('YOUR-PROJECT')
  );
  window.EXPO_CONFIGURED = configured;
  window.EXPO_DB = configured && window.supabase?.createClient
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;

  // Keep all browser-side database row -> existing card object conversions in one place.
  window.EXPO_UTILS = {
    asProject(row) {
      const baseUrl = row.image_path && window.EXPO_DB
        ? window.EXPO_DB.storage.from(config.bucket).getPublicUrl(row.image_path).data.publicUrl
        : '';
      const version = row.image_updated_at ? new Date(row.image_updated_at).getTime() : '';
      return {
        id: row.id,
        authorId: row.author_id,
        title: row.title,
        description: row.description,
        category: row.category,
        date: row.created_at.slice(0, 10),
        image: baseUrl ? `${baseUrl}?v=${version}` : 'images/photo-placeholder.svg',
        imageAlt: row.image_alt || row.title,
        featured: row.featured
      };
    },
    async fetchProjects() {
      const { data, error } = await window.EXPO_DB.from('projects')
        .select('id,author_id,title,description,category,created_at,image_path,image_alt,image_updated_at,featured')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(this.asProject);
    },
    message(target, text, isError = false) {
      target.textContent = text;
      target.classList.toggle('error-text', isError);
      target.hidden = !text;
    }
  };
})();
