import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True only when both credentials were present at build time. Vite inlines
 * these at build time, so a missing value means the deploy was built without
 * the environment variables set — not something fixable at runtime.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR-PROJECT-REF'),
)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials are missing. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY (locally in .env, on Netlify in the site ' +
      'environment variables) and rebuild.',
  )
}

// Fall back to a syntactically valid placeholder so createClient doesn't throw
// and take the whole page down — the app shows a clear message instead.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)
