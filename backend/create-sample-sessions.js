const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createSampleSessions() {
  console.log('=== CREATING SAMPLE SESSIONS ===\n');
  
  // Get coach and client IDs
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id')
    .limit(1);
    
  const { data: clients } = await supabase
    .from('clients') 
    .select('id')
    .limit(2);
    
  if (!coaches || coaches.length === 0) {
    console.error('No coaches found');
    return;
  }
  
  if (!clients || clients.length === 0) {
    console.error('No clients found');  
    return;
  }
  
  const coachId = coaches[0].id;
  console.log('Using coach ID:', coachId);
  console.log('Using clients:', clients.map(c => c.id));
  
  // Create some sample sessions with required fields
  const sessions = [
    {
      coach_id: coachId,
      client_id: clients[0].id,
      scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      status: 'completed',
      duration: 60,
      session_type: 'coaching',
      notes: 'Completed session - great progress'
    },
    {
      coach_id: coachId,
      client_id: clients[0].id,
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now  
      status: 'scheduled',
      duration: 60,
      session_type: 'coaching',
      notes: 'Upcoming session scheduled'
    }
  ];
  
  if (clients.length > 1) {
    sessions.push({
      coach_id: coachId,
      client_id: clients[1].id,
      scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      status: 'completed',
      duration: 60,
      session_type: 'coaching',
      notes: 'Completed follow-up session'
    });
  }
  
  const { data: insertedSessions, error } = await supabase
    .from('sessions')
    .insert(sessions)
    .select();
    
  if (error) {
    console.error('Error creating sessions:', error);
  } else {
    console.log('Created', insertedSessions?.length || 0, 'sessions');
    console.log('Sample session:', insertedSessions?.[0]);
  }
}

createSampleSessions();