import { createClient } from '@supabase/supabase-js';

// Setup these variables in your frontend/.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize with dummy values if missing to prevent app crash, 
// but actual OAuth will be blocked by the frontend check until configured.
export const supabase = createClient(
  supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co', 
  supabaseKey
);
