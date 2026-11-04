(async () => {
  'use strict';
  const db = window.EXPO_DB;
  const createLink = document.getElementById('create-post-nav');
  const accountLink = document.getElementById('account-nav');
  const signOutButton = document.getElementById('sign-out-nav');
  if (!db) return;

  function paintNav(session) {
    const signedIn = Boolean(session);
    if (createLink) createLink.hidden = !signedIn;
    if (accountLink) {
      accountLink.textContent = signedIn ? 'Account' : 'Sign In';
      accountLink.href = 'login.html';
    }
    if (signOutButton) signOutButton.hidden = !signedIn;
  }
  if (signOutButton) signOutButton.addEventListener('click', async () => {
    signOutButton.disabled = true;
    const { error } = await db.auth.signOut();
    if (error) { alert(`Could not sign out: ${error.message}`); signOutButton.disabled = false; return; }
    window.location.href = 'index.html';
  });
  // Keep this callback synchronous: Supabase warns that awaiting auth API
  // calls inside onAuthStateChange can lead to deadlocks.
  db.auth.onAuthStateChange((_event, session) => paintNav(session));
  const { data: { session } } = await db.auth.getSession();
  paintNav(session);
})();
