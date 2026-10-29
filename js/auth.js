(async () => {
  'use strict';
  const form = document.getElementById('auth-form');
  const submit = document.getElementById('auth-submit');
  const toggle = document.getElementById('auth-toggle');
  const headline = document.getElementById('auth-headline');
  const hint = document.getElementById('auth-hint');
  const message = document.getElementById('auth-message');
  const db = window.EXPO_DB;
  let isSignup = false;

  if (!db) {
    window.EXPO_UTILS.message(message, 'Supabase is not configured. Add your project URL and publishable key to supabase-config.js first.', true);
    form.hidden = true;
    toggle.hidden = true;
    return;
  }
  const { data: { user } } = await db.auth.getUser();
  if (user) {
    hint.textContent = `Signed in as ${user.email}.`;
    form.hidden = true;
    toggle.hidden = true;
    const link = document.createElement('a');
    link.className = 'primary-button';
    link.href = 'create-post.html';
    link.textContent = 'Create a post';
    hint.after(link);
    return;
  }

  toggle.addEventListener('click', () => {
    isSignup = !isSignup;
    headline.textContent = isSignup ? 'Create an account' : 'Sign in';
    submit.textContent = isSignup ? 'Create account' : 'Sign in';
    toggle.textContent = isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    window.EXPO_UTILS.message(message, '');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    submit.disabled = true;
    window.EXPO_UTILS.message(message, isSignup ? 'Creating your account...' : 'Signing you in...');
    try {
      const result = isSignup
        ? await db.auth.signUp({ email, password, options: { emailRedirectTo: new URL('login.html', window.location.href).href } })
        : await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (isSignup && !result.data.session) {
        window.EXPO_UTILS.message(message, 'Check your inbox for a verification email, then sign in.');
        return;
      }
      // Prevent open redirects: only our own create-post route can be used as next.
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next === 'create-post.html' ? 'create-post.html' : 'index.html';
    } catch (error) {
      window.EXPO_UTILS.message(message, error.message || 'Authentication failed.', true);
    } finally {
      submit.disabled = false;
    }
  });
})();
