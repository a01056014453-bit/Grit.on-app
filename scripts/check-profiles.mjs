import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check profiles
const { data: profiles } = await s.from('profiles').select('id, nickname, name, instrument, created_at').order('created_at', { ascending: false }).limit(10);
console.log('=== Profiles ===');
profiles?.forEach(p => console.log(JSON.stringify(p)));

// Check auth users
const { data: { users } } = await s.auth.admin.listUsers({ perPage: 10 });
console.log('\n=== Auth Users ===');
users?.forEach(u => console.log(JSON.stringify({ id: u.id, email: u.email, provider: u.app_metadata?.provider, created_at: u.created_at })));
