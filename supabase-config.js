// 1. In Supabase > Project Settings > Data API, copy the Project URL.
// 2. In Supabase > Project Settings > API Keys, copy the PUBLISHABLE key.
// This public key is safe to use in frontend code when RLS is configured.
// NEVER put your secret/service_role key here.
window.EXPO_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'sb_publishable_REPLACE_ME',
  bucket: 'project-photos'
};
