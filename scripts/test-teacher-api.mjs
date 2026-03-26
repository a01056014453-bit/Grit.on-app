import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Find the user "지구" or "a01056014453"
const { data: profiles } = await s.from('profiles').select('id, nickname, name').or('nickname.eq.지구,name.eq.a01056014453,nickname.eq.a01056014453');
console.log('Found profiles:', profiles);

if (profiles && profiles.length > 0) {
  const userId = profiles[0].id;
  const name = profiles[0].nickname || profiles[0].name;
  console.log(`Using userId: ${userId}, name: ${name}`);

  // Directly insert teacher record
  const { data, error } = await s.from('teachers').upsert({
    id: `v-${Date.now()}`,
    name: name,
    specialty: ['피아노'],
    verified: false,
    user_id: userId,
    career: {
      verification: {
        status: 'pending',
        documents: [],
        aiReview: null,
        appliedAt: new Date().toISOString(),
      },
    },
  });

  console.log('Insert result:', { data, error: error?.message });

  // Verify it was inserted
  const { data: teachers } = await s.from('teachers').select('id, name, user_id, verified, career').order('created_at', { ascending: false });
  console.log('Teachers now:', teachers?.length);
  teachers?.forEach(t => {
    const hasV = t.career?.verification ? true : false;
    console.log(JSON.stringify({ id: t.id, name: t.name, user_id: t.user_id, verified: t.verified, hasVerification: hasV }));
  });
}
