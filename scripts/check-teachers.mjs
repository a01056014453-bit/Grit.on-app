import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await s.from('teachers').select('id, name, user_id, verified, career, created_at').order('created_at', { ascending: false });

console.log('Error:', error);
console.log('Count:', data ? data.length : 0);
if (data) {
  data.forEach(r => {
    const c = r.career || {};
    const hasV = c.verification ? true : false;
    console.log(JSON.stringify({ id: r.id, name: r.name, user_id: r.user_id, verified: r.verified, hasVerification: hasV, created_at: r.created_at }));
  });
}
