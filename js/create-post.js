(async () => {
  'use strict';
  const db = window.EXPO_DB;
  const form = document.getElementById('post-form');
  const message = document.getElementById('post-message');
  const saveButton = document.getElementById('save-post');
  const deleteButton = document.getElementById('delete-post');
  const input = document.getElementById('post-image');
  const preview = document.getElementById('photo-preview');
  const existingNote = document.getElementById('existing-photo-note');
  const id = new URLSearchParams(location.search).get('id');
  const isEditing = Boolean(id);
  let currentProject = null;
  let currentUser = null;
  let previewUrl = null;

  const say = (text, error = false) => window.EXPO_UTILS.message(message, text, error);
  if (!db) { form.hidden = true; say('Add your Supabase project URL and publishable key in supabase-config.js before posting.', true); return; }
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) {
    location.replace('login.html?next=create-post.html');
    return;
  }
  currentUser = user;
  document.getElementById('author-label').textContent = `Posting as ${user.email}`;

  if (isEditing) {
    document.getElementById('form-title').textContent = 'Edit project';
    saveButton.textContent = 'Save changes';
    deleteButton.hidden = false;
    input.required = false;
    try {
      const { data, error } = await db.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      if (data.author_id !== currentUser.id) { form.hidden = true; say('You cannot edit someone else\'s post.', true); return; }
      currentProject = data;
      document.getElementById('post-title').value = data.title;
      document.getElementById('post-description').value = data.description;
      document.getElementById('post-category').value = data.category;
      document.getElementById('post-alt').value = data.image_alt || '';
      const url = db.storage.from(window.EXPO_CONFIG.bucket).getPublicUrl(data.image_path).data.publicUrl;
      preview.src = `${url}?v=${new Date(data.image_updated_at).getTime()}`;
      preview.hidden = false;
      existingNote.textContent = 'Choose a different photo to replace this one, or leave it unchanged.';
      existingNote.hidden = false;
    } catch (error) { form.hidden = true; say(`Unable to load project: ${error.message}`, true); return; }
  }

  input.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = input.files?.[0];
    if (file) {
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
      preview.hidden = false;
      existingNote.textContent = 'Preview only; it will be resized and converted to WebP before uploading.';
      existingNote.hidden = false;
    } else if (!isEditing) {
      preview.hidden = true;
      existingNote.hidden = true;
    }
  });

  // One resized WebP per post, constrained to the storage bucket's 2 MB limit.
  async function makeWebp(file) {
    if (!file.type.startsWith('image/')) throw new Error('Choose a photo, not another file type.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');
    const image = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.80));
      if (!blob || blob.type !== 'image/webp') throw new Error('Your browser could not convert this photo to WebP.');
      if (blob.size > 2 * 1024 * 1024) throw new Error('This image is still over 2 MB after resizing. Choose a smaller photo.');
      return blob;
    } finally { image.close(); }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const title = document.getElementById('post-title').value.trim();
    const description = document.getElementById('post-description').value.trim();
    const category = document.getElementById('post-category').value;
    const imageAlt = document.getElementById('post-alt').value.trim() || title;
    const file = input.files?.[0];
    if (!isEditing && !file) { say('Select one photo to publish your post.', true); return; }
    if (title.length < 3 || title.length > 100 || description.length < 10 || description.length > 1000) {
      say('Title must be 3–100 characters; description must be 10–1000 characters.', true);
      return;
    }
    saveButton.disabled = true;
    deleteButton.disabled = true;
    say('Saving your project...');
    const postId = isEditing ? id : crypto.randomUUID();
    const imagePath = `${currentUser.id}/${postId}.webp`;
    let newlyUploaded = false;
    try {
      if (file) {
        const webp = await makeWebp(file);
        const { error: uploadError } = await db.storage.from(window.EXPO_CONFIG.bucket)
          .upload(imagePath, webp, { contentType: 'image/webp', cacheControl: '3600', upsert: isEditing });
        if (uploadError) throw uploadError;
        newlyUploaded = true;
      }
      if (isEditing) {
        const changes = { title, description, category, image_alt: imageAlt, updated_at: new Date().toISOString() };
        if (file) changes.image_updated_at = new Date().toISOString();
        const { data, error } = await db.from('projects').update(changes).eq('id', postId).select('id');
        if (error) throw error;
        if (!data.length) throw new Error('You do not have permission to edit this project.');
      } else {
        const { error } = await db.from('projects').insert({
          id: postId, author_id: currentUser.id, title, description, category,
          image_alt: imageAlt, image_path: imagePath
        });
        if (error) {
          // If the DB insert fails, avoid leaving a detached file behind.
          if (newlyUploaded) await db.storage.from(window.EXPO_CONFIG.bucket).remove([imagePath]);
          throw error;
        }
      }
      location.assign(`project.html?id=${encodeURIComponent(postId)}`);
    } catch (error) {
      const suffix = isEditing && newlyUploaded ? ' The replacement photo may already be updated; retry saving the text.' : '';
      say(`${error.message}${suffix}`, true);
      saveButton.disabled = false;
      deleteButton.disabled = false;
    }
  });

  deleteButton.addEventListener('click', async () => {
    if (!currentProject || !confirm('Delete this project permanently?')) return;
    deleteButton.disabled = true;
    saveButton.disabled = true;
    say('Deleting post...');
    try {
      const { data, error } = await db.from('projects').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data.length) throw new Error('This post could not be deleted.');
      const { error: storageError } = await db.storage.from(window.EXPO_CONFIG.bucket).remove([currentProject.image_path]);
      if (storageError) {
        say('Post deleted, but photo cleanup failed. Contact an administrator.', true);
        return;
      }
      location.assign('index.html');
    } catch (error) { say(error.message, true); deleteButton.disabled = false; saveButton.disabled = false; }
  });
})();
